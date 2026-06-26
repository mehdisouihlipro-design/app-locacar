const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const PORT = process.env.PORT || 3000;
const FILE_PATH = path.join(__dirname, 'worksheet-mini-app', 'index.html');

// Case-insensitive env var lookup (Railway variable names may vary in casing)
function getEnv(name) {
  if (process.env[name]) return process.env[name];
  const lower = name.toLowerCase();
  const found = Object.keys(process.env).find(k => k.toLowerCase() === lower);
  return found ? process.env[found] : '';
}

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 2 * 1024 * 1024) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!data) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

async function supabaseFetch(url, options) {
  const normalizedUrl = normalizeSupabaseUrl(url);
  if (typeof fetch !== 'function') {
    return supabaseFetchViaPowerShell(normalizedUrl, options);
  }
  try {
    const res = await fetch(normalizedUrl, options);
    const text = await res.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch (_) {
      json = text || null;
    }
    return { ok: res.ok, status: res.status, body: json };
  } catch (_) {
    // Corporate VPN/proxy setups may block Node fetch while PowerShell requests still work.
    return supabaseFetchViaPowerShell(normalizedUrl, options);
  }
}

function normalizeSupabaseUrl(url) {
  return String(url || '')
    .trim()
    .replace(/\/$/, '')
    .replace(/\/rest\/v1\/?$/i, '');
}

function supabaseFetchViaPowerShell(url, options) {
  const payload = {
    url,
    method: (options && options.method) || 'GET',
    headers: (options && options.headers) || {},
    body: (options && options.body) || '',
  };

  const script = `
$in = [Console]::In.ReadToEnd() | ConvertFrom-Json
$headers = @{}
if ($in.headers) {
  $in.headers.PSObject.Properties | ForEach-Object { $headers[$_.Name] = [string]$_.Value }
}
$contentType = $null
if ($headers.ContainsKey('Content-Type')) {
  $contentType = $headers['Content-Type']
  $headers.Remove('Content-Type')
}
$params = @{
  Uri = $in.url
  Method = $in.method
  Headers = $headers
  UseBasicParsing = $true
}
if ($contentType) { $params['ContentType'] = $contentType }
if ($in.body -and [string]$in.body -ne '') { $params['Body'] = [string]$in.body }
try {
  $resp = Invoke-WebRequest @params
  $out = @{ ok = $true; status = [int]$resp.StatusCode; body = $resp.Content }
  $out | ConvertTo-Json -Compress
} catch {
  if ($_.Exception.Response) {
    $resp = $_.Exception.Response
    $status = [int]$resp.StatusCode
    $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
    $body = $reader.ReadToEnd()
    $out = @{ ok = $false; status = $status; body = $body }
    $out | ConvertTo-Json -Compress
  } else {
    $out = @{ ok = $false; status = 500; body = ($_.Exception.Message) }
    $out | ConvertTo-Json -Compress
  }
}
`;

  const ps = spawnSync('powershell.exe', ['-NoProfile', '-Command', script], {
    input: JSON.stringify(payload),
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });

  if (ps.error) {
    throw new Error(`PowerShell fallback failed: ${ps.error.message}`);
  }

  const raw = (ps.stdout || '').trim();
  if (!raw) {
    const err = (ps.stderr || '').trim() || 'Unknown PowerShell error';
    throw new Error(`PowerShell fallback empty response: ${err}`);
  }

  let out;
  try {
    out = JSON.parse(raw);
  } catch (_) {
    throw new Error(`PowerShell fallback invalid JSON: ${raw.slice(0, 300)}`);
  }

  let body = out.body;
  if (typeof body === 'string') {
    const trimmed = body.trim();
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        body = JSON.parse(trimmed);
      } catch (_) {
        body = trimmed;
      }
    }
  }

  return { ok: Boolean(out.ok), status: Number(out.status || 500), body };
}

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);

  if (req.method === 'GET' && parsedUrl.pathname === '/api/status') {
    sendJson(res, 200, {
      version: '2.0',
      supabase_url_set: Boolean(getEnv('SUPABASE_URL')),
      supabase_key_set: Boolean(getEnv('SUPABASE_ANON_KEY')),
      anthropic_set: Boolean(getEnv('ANTHROPIC_API_KEY')),
      railway_project: process.env.RAILWAY_PROJECT_NAME || 'unknown',
      railway_service: process.env.RAILWAY_SERVICE_NAME || 'unknown',
      railway_url: process.env.RAILWAY_PUBLIC_DOMAIN || 'unknown',
    });
    return;
  }

  if (req.method === 'POST' && parsedUrl.pathname === '/api/proxy/auth') {
    readJsonBody(req)
      .then(async (body) => {
        const { mode, url, anonKey, email, password } = body;
        const baseUrl = normalizeSupabaseUrl(url);
        if (!url || !anonKey || !email || !password) {
          sendJson(res, 400, { error: 'Missing required fields.' });
          return;
        }

        const endpoint = mode === 'signup'
          ? `${baseUrl}/auth/v1/signup`
          : `${baseUrl}/auth/v1/token?grant_type=password`;

        const apiRes = await supabaseFetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
          },
          body: JSON.stringify({ email, password }),
        });

        if (!apiRes.ok) {
          const msg = (apiRes.body && (apiRes.body.error_description || apiRes.body.msg || apiRes.body.message)) || `HTTP ${apiRes.status}`;
          sendJson(res, 200, { error: msg });
          return;
        }

        const out = apiRes.body || {};
        const session = out.access_token
          ? {
              access_token: out.access_token,
              refresh_token: out.refresh_token,
              user: out.user,
            }
          : (out.session || null);

        sendJson(res, 200, {
          error: null,
          session,
          user: out.user || (out.session ? out.session.user : null),
        });
      })
      .catch((e) => sendJson(res, 500, { error: e.message }));
    return;
  }

  if (req.method === 'POST' && parsedUrl.pathname === '/api/proxy/snapshot/load') {
    readJsonBody(req)
      .then(async (body) => {
        const { url, anonKey, userId, accessToken } = body;
        const baseUrl = normalizeSupabaseUrl(url);
        if (!url || !anonKey || !userId || !accessToken) {
          sendJson(res, 400, { error: 'Missing required fields.' });
          return;
        }

        const endpoint = `${baseUrl}/rest/v1/app_snapshots?select=payload&user_id=eq.${encodeURIComponent(userId)}`;
        const apiRes = await supabaseFetch(endpoint, {
          method: 'GET',
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!apiRes.ok) {
          const msg = (apiRes.body && (apiRes.body.message || apiRes.body.error_description || apiRes.body.error)) || `HTTP ${apiRes.status}`;
          sendJson(res, 200, { error: msg });
          return;
        }

        const row = Array.isArray(apiRes.body) && apiRes.body.length > 0 ? apiRes.body[0] : null;
        sendJson(res, 200, { error: null, payload: row ? row.payload : null });
      })
      .catch((e) => sendJson(res, 500, { error: e.message }));
    return;
  }

  if (req.method === 'POST' && parsedUrl.pathname === '/api/proxy/snapshot/save') {
    readJsonBody(req)
      .then(async (body) => {
        const { url, anonKey, userId, accessToken, payload } = body;
        const baseUrl = normalizeSupabaseUrl(url);
        if (!url || !anonKey || !userId || !accessToken) {
          sendJson(res, 400, { error: 'Missing required fields.' });
          return;
        }

        const endpoint = `${baseUrl}/rest/v1/app_snapshots?on_conflict=user_id`;
        const apiRes = await supabaseFetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: anonKey,
            Authorization: `Bearer ${accessToken}`,
            Prefer: 'resolution=merge-duplicates,return=minimal',
          },
          body: JSON.stringify([{ user_id: userId, payload, updated_at: new Date().toISOString() }]),
        });

        if (!apiRes.ok) {
          const msg = (apiRes.body && (apiRes.body.message || apiRes.body.error_description || apiRes.body.error)) || `HTTP ${apiRes.status}`;
          sendJson(res, 200, { error: msg });
          return;
        }

        sendJson(res, 200, { error: null });
      })
      .catch((e) => sendJson(res, 500, { error: e.message }));
    return;
  }

  // ── Souche de numéros ────────────────────────────────────────────────────────
  // GET /api/next-sequence/:id — lit number_sequences, incrémente, retourne le numéro formaté
  if (req.method === 'GET' && parsedUrl.pathname.startsWith('/api/next-sequence/')) {
    const sequenceId = parsedUrl.pathname.split('/api/next-sequence/')[1];
    if (!sequenceId) { sendJson(res, 400, { error: 'sequenceId manquant' }); return; }

    (async () => {
      const supabaseUrl = getEnv('SUPABASE_URL');
      const serviceKey  = getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('SUPABASE_SERVICE_KEY') || getEnv('SUPABASE_ANON_KEY');
      if (!supabaseUrl || !serviceKey) { sendJson(res, 500, { error: 'SUPABASE_URL ou clé non configurés' }); return; }

      const base = supabaseUrl.trim().replace(/\/$/, '').replace(/\/rest\/v1\/?$/i, '');
      const headers = { 'Content-Type': 'application/json', apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };

      // 1. Lire la souche
      const getRes = await supabaseFetch(`${base}/rest/v1/number_sequences?id=eq.${encodeURIComponent(sequenceId)}&select=*`, { headers });
      if (!getRes.ok || !Array.isArray(getRes.body) || !getRes.body[0]) {
        sendJson(res, 404, { error: `Souche "${sequenceId}" introuvable` });
        return;
      }
      const seq = getRes.body[0];

      // 2. Calculer le prochain numéro
      const year = new Date().getFullYear();
      const newNumber = (seq.reset_annually && (!seq.last_year || Number(seq.last_year) < year))
        ? 1 : (Number(seq.last_number) || 0) + 1;

      // 3. Incrémenter dans la base
      await supabaseFetch(`${base}/rest/v1/number_sequences?id=eq.${encodeURIComponent(sequenceId)}`, {
        method: 'PATCH',
        headers: { ...headers, Prefer: 'return=minimal' },
        body: JSON.stringify({ last_number: newNumber, last_year: year }),
      });

      // 4. Formater le numéro
      let n = seq.prefix ? seq.prefix + seq.separator : '';
      if (seq.include_year) n += String(year) + seq.separator;
      n += String(newNumber).padStart(Number(seq.digits) || 4, '0');

      sendJson(res, 200, { number: n });
    })().catch(e => sendJson(res, 500, { error: e.message }));
    return;
  }

  // POST /api/reset-sequences — remet tous les compteurs de souche à 0
  if (req.method === 'POST' && parsedUrl.pathname === '/api/reset-sequences') {
    (async () => {
      const supabaseUrl = getEnv('SUPABASE_URL');
      const serviceKey  = getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('SUPABASE_SERVICE_KEY') || getEnv('SUPABASE_ANON_KEY');
      if (!supabaseUrl || !serviceKey) { sendJson(res, 500, { error: 'SUPABASE_URL ou clé non configurés' }); return; }
      const base = supabaseUrl.trim().replace(/\/$/, '').replace(/\/rest\/v1\/?$/i, '');
      const headers = { 'Content-Type': 'application/json', apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };
      // Remettre tous les compteurs à 0 (filtre sur last_number >= 0 = toutes les lignes)
      const patchRes = await supabaseFetch(`${base}/rest/v1/number_sequences?last_number=gte.0`, {
        method: 'PATCH',
        headers: { ...headers, Prefer: 'return=minimal' },
        body: JSON.stringify({ last_number: 0, last_year: null }),
      });
      if (!patchRes.ok) { sendJson(res, 500, { error: `Supabase PATCH échoué: ${patchRes.status}` }); return; }
      sendJson(res, 200, { ok: true });
    })().catch(e => sendJson(res, 500, { error: e.message }));
    return;
  }

  if (req.method === 'POST' && parsedUrl.pathname === '/api/analyze-damages') {
    readJsonBody(req)
      .then(async (body) => {
        const { sortiePhotos = [], entreePhotos = [], carPlate, contractId } = body;
        const apiKey = process.env.ANTHROPIC_API_KEY;

        if (!apiKey) {
          sendJson(res, 400, { error: 'ANTHROPIC_API_KEY not configured on server.' });
          return;
        }

        if (sortiePhotos.length === 0 && entreePhotos.length === 0) {
          sendJson(res, 400, { error: 'At least one photo is required.' });
          return;
        }

        try {
          const photos = [];
          
          if (sortiePhotos.length > 0) {
            photos.push({
              type: 'exit',
              data: sortiePhotos[0],
            });
          }

          if (entreePhotos.length > 0) {
            photos.push({
              type: 'entry',
              data: entreePhotos[0],
            });
          }

          const content = [];
          
          photos.forEach((photo, idx) => {
            const base64 = photo.data.includes('base64,') 
              ? photo.data.split('base64,')[1]
              : photo.data;

            content.push({
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: base64,
              },
            });

            if (idx === 0 && photos.length > 1) {
              content.push({
                type: 'text',
                text: 'This is the EXIT photo (state when vehicle left).',
              });
            } else if (idx === 1) {
              content.push({
                type: 'text',
                text: 'This is the ENTRY photo (state when vehicle returned).',
              });
            }
          });

          content.push({
            type: 'text',
            text: `Analyze these inspection photos of vehicle ${carPlate} (contract: ${contractId}).
            ${photos.length === 2 ? 'Compare the EXIT (departure) photo with the ENTRY (return) photo to identify new damage, dirt, or deterioration.' : 'Analyze this photo for damage, dirt, and overall condition.'}
            
            Provide a JSON response with:
            {
              "hasDamage": boolean,
              "damages": [{"location": string, "description": string, "severity": "minor|moderate|severe", "type": "scratch|dent|dirt|tire_wear|other"}],
              "recommendations": ["action1", "action2"],
              "overallCondition": "excellent|good|fair|poor"
            }`,
          });

          const message = {
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1024,
            messages: [
              {
                role: 'user',
                content: content,
              },
            ],
          };

          const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify(message),
          });

          const apiBody = await apiRes.json();

          if (!apiRes.ok) {
            const errorMsg = apiBody.error?.message || `HTTP ${apiRes.status}`;
            sendJson(res, 200, { error: errorMsg, analysis: null });
            return;
          }

          let analysis = null;
          const textContent = apiBody.content?.find(c => c.type === 'text');
          if (textContent && textContent.text) {
            try {
              const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                analysis = JSON.parse(jsonMatch[0]);
              }
            } catch (_) {
              analysis = {
                hasDamage: false,
                damages: [],
                recommendations: [],
                overallCondition: 'unknown',
                rawResponse: textContent.text,
              };
            }
          }

          sendJson(res, 200, { error: null, analysis });
        } catch (e) {
          sendJson(res, 500, { error: e.message });
        }
      })
      .catch((e) => sendJson(res, 500, { error: e.message }));
    return;
  }

  if (parsedUrl.pathname === '/favicon.ico') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Static files
  const staticFiles = {
    '/html2pdf.bundle.min.js': { file: path.join(__dirname, 'worksheet-mini-app', 'html2pdf.bundle.min.js'), mime: 'application/javascript' },
    '/1000095084.jpg': { file: path.join(__dirname, '1000095084.jpg'), mime: 'image/jpeg' },
  };
  if (req.method === 'GET' && staticFiles[parsedUrl.pathname]) {
    const { file, mime } = staticFiles[parsedUrl.pathname];
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404); res.end('Not found'); return; }
      res.writeHead(200, { 'Content-Type': mime });
      res.end(data);
    });
    return;
  }

  if (parsedUrl.pathname === '/' || parsedUrl.pathname === '/index.html' || parsedUrl.pathname === '/worksheet-mini-app/index.html') {
    fs.readFile(FILE_PATH, 'utf8', (err, content) => {
      if (err) {
        res.writeHead(500);
        res.end('Error reading file');
        return;
      }
      // Auto-inject config from env vars
      const supabaseUrl = getEnv('SUPABASE_URL');
      const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');
      const apiUrl = getEnv('API_URL');
      let inject = '';
      if (supabaseUrl && supabaseAnonKey) {
        const cfg = JSON.stringify({ url: supabaseUrl, anonKey: supabaseAnonKey });
        inject += `<script>localStorage.setItem('locacar-supabase-cfg',${JSON.stringify(cfg)});</script>`;
      }
      if (apiUrl) {
        inject += `<script>window._API_URL=${JSON.stringify(apiUrl)};</script>`;
      }
      const logoUrl = getEnv('LOGO_URL');
      const companyName = getEnv('COMPANY_NAME');
      if (logoUrl) inject += `<script>window._LOGO_URL=${JSON.stringify(logoUrl)};</script>`;
      if (companyName) inject += `<script>window._COMPANY_NAME=${JSON.stringify(companyName)};</script>`;
      if (inject) content = content.replace('</head>', inject + '</head>');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content);
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log(`Press Ctrl+C to stop`);
});
