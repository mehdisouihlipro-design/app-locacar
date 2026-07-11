// ============================================================
// LocaCar — Admin Portail Site Web
// ============================================================

const API = (window.SITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');
const LS_TOKEN = 'locarcar_admin_token';
const LS_USER  = 'locarcar_admin_user';

// ─── État ────────────────────────────────────────────────────
let token         = localStorage.getItem(LS_TOKEN) || '';
let currentUser   = JSON.parse(localStorage.getItem(LS_USER) || 'null');
let allCars       = [];
let allUnavails   = [];
let modalCarId    = null;

// ─── DOM ─────────────────────────────────────────────────────
const loginPage     = document.getElementById('loginPage');
const adminLayout   = document.getElementById('adminLayout');
const loginForm     = document.getElementById('loginForm');
const loginEmail    = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const loginBtn      = document.getElementById('loginBtn');
const loginError    = document.getElementById('loginError');
const logoutBtn     = document.getElementById('logoutBtn');
const adminUserName = document.getElementById('adminUserName');
const carsCount     = document.getElementById('carsCount');
const carsTableBody = document.getElementById('carsTableBody');
const unavailModal  = document.getElementById('unavailModal');
const modalCarTitle = document.getElementById('modalCarTitle');
const unavailList   = document.getElementById('unavailList');
const unavailFrom   = document.getElementById('unavailFrom');
const unavailTo     = document.getElementById('unavailTo');
const unavailNotes  = document.getElementById('unavailNotes');
const addUnavailBtn = document.getElementById('addUnavailBtn');
const closeModal    = document.getElementById('closeModal');
const toastEl       = document.getElementById('toast');

// ─── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (token && currentUser) {
    showDashboard();
    loadData();
  } else {
    showLogin();
  }

  loginForm.addEventListener('submit', handleLogin);
  logoutBtn.addEventListener('click', handleLogout);
  closeModal.addEventListener('click', () => unavailModal.classList.add('hidden'));
  unavailModal.addEventListener('click', e => { if (e.target === unavailModal) unavailModal.classList.add('hidden'); });
  addUnavailBtn.addEventListener('click', handleAddUnavail);
});

// ─── Auth ─────────────────────────────────────────────────────
async function handleLogin(e) {
  e.preventDefault();
  loginBtn.textContent = 'Connexion…';
  loginBtn.disabled = true;
  loginError.classList.add('hidden');

  try {
    const res  = await fetch(`${API}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: loginEmail.value.trim(), password: loginPassword.value }),
    });
    const json = await res.json();

    if (!res.ok || !json.success) throw new Error(json.message || 'Identifiants invalides.');

    token       = json.data.token;
    currentUser = json.data.user;
    localStorage.setItem(LS_TOKEN, token);
    localStorage.setItem(LS_USER, JSON.stringify(currentUser));

    showDashboard();
    loadData();
  } catch (err) {
    loginError.textContent = err.message;
    loginError.classList.remove('hidden');
  } finally {
    loginBtn.textContent = 'Se connecter';
    loginBtn.disabled = false;
  }
}

function handleLogout() {
  token = ''; currentUser = null;
  localStorage.removeItem(LS_TOKEN);
  localStorage.removeItem(LS_USER);
  showLogin();
}

function showLogin()     { loginPage.classList.remove('hidden'); adminLayout.classList.add('hidden'); }
function showDashboard() {
  loginPage.classList.add('hidden');
  adminLayout.classList.remove('hidden');
  adminUserName.textContent = currentUser?.full_name || currentUser?.email || '';
}

// ─── Data ─────────────────────────────────────────────────────
async function loadData() {
  carsTableBody.innerHTML = '<tr class="loading-row"><td colspan="6">Chargement…</td></tr>';
  try {
    const [carsRes, unavailRes] = await Promise.all([
      authFetch('/api/v1/site-admin/cars'),
      authFetch('/api/v1/site-admin/unavailabilities'),
    ]);

    if (!carsRes.ok) {
      if (carsRes.status === 401) { handleLogout(); return; }
      throw new Error('Erreur chargement voitures');
    }

    allCars    = (await carsRes.json()).data  || [];
    allUnavails = (await unavailRes.json()).data || [];

    renderTable();
  } catch (err) {
    carsTableBody.innerHTML = `<tr class="loading-row"><td colspan="6" style="color:var(--danger)">Erreur : ${esc(err.message)}</td></tr>`;
  }
}

// ─── Table ────────────────────────────────────────────────────
function renderTable() {
  carsCount.textContent = `${allCars.length} véhicule${allCars.length !== 1 ? 's' : ''}`;

  if (allCars.length === 0) {
    carsTableBody.innerHTML = '<tr class="loading-row"><td colspan="6">Aucun véhicule trouvé.</td></tr>';
    return;
  }

  carsTableBody.innerHTML = '';
  allCars.forEach(car => {
    const carUnavails = allUnavails.filter(u => u.car_id === car.id);
    carsTableBody.appendChild(buildRow(car, carUnavails));
  });
}

function buildRow(car, carUnavails) {
  const tr = document.createElement('tr');
  tr.dataset.carId = car.id;

  const thumbHtml = car.photo_url
    ? `<img src="${esc(car.photo_url)}" class="car-thumb" alt=""
           onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="car-thumb-placeholder" style="display:none">🚗</div>`
    : `<div class="car-thumb-placeholder">🚗</div>`;

  tr.innerHTML = `
    <td><div style="display:flex">${thumbHtml}</div></td>
    <td>
      <div style="font-weight:700;color:var(--primary)">${esc(car.brand || '')} ${esc(car.model || '')}</div>
      <div style="font-size:.78rem;color:var(--text-muted);margin-top:2px">
        ${esc(car.fuel_type || '')}${car.color ? ' · ' + esc(car.color) : ''}${car.location ? ' · ' + esc(car.location) : ''}
      </div>
    </td>
    <td>
      <label class="toggle-switch" title="${car.site_visible ? 'Visible sur le site' : 'Non visible'}">
        <input type="checkbox" class="toggle-visible" data-car-id="${car.id}" ${car.site_visible ? 'checked' : ''}>
        <span class="toggle-slider"></span>
      </label>
    </td>
    <td>
      <input type="url" class="field-input field-url field-photo-url"
        data-car-id="${car.id}" value="${esc(car.photo_url || '')}" placeholder="https://…" autocomplete="off">
    </td>
    <td>
      <input type="number" class="field-input field-price field-price-day"
        data-car-id="${car.id}" value="${car.site_price_day != null ? car.site_price_day : ''}" placeholder="0.00" min="0" step="0.5">
    </td>
    <td>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        ${buildUnavailBadge(carUnavails)}
        <button class="btn btn-ghost btn-manage-unavail" data-car-id="${car.id}" style="font-size:.78rem;padding:5px 10px">Gérer</button>
      </div>
    </td>
  `;

  tr.querySelector('.toggle-visible').addEventListener('change', e => {
    updateCar(car.id, { site_visible: e.target.checked });
  });
  tr.querySelector('.field-photo-url').addEventListener('blur', e => {
    updateCar(car.id, { photo_url: e.target.value.trim() || null }, e.target);
  });
  tr.querySelector('.field-price-day').addEventListener('blur', e => {
    const v = e.target.value.trim();
    updateCar(car.id, { site_price_day: v !== '' ? parseFloat(v) : null }, e.target);
  });
  tr.querySelector('.btn-manage-unavail').addEventListener('click', () => openUnavailModal(car));

  return tr;
}

function buildUnavailBadge(items) {
  if (items.length === 0) return `<span class="dispo-badge empty">Aucune restriction</span>`;
  return `<span class="dispo-badge unavail">🚫 ${items.length} plage${items.length > 1 ? 's' : ''}</span>`;
}

// ─── Update car ────────────────────────────────────────────────
async function updateCar(carId, fields, inputEl = null) {
  try {
    const res = await authFetch(`/api/v1/site-admin/cars/${carId}`, {
      method: 'PUT',
      body: JSON.stringify(fields),
    });
    if (!res.ok) throw new Error('Erreur sauvegarde');

    const car = allCars.find(c => c.id === carId);
    if (car) Object.assign(car, fields);

    if (inputEl) {
      inputEl.classList.add('field-saved');
      setTimeout(() => inputEl.classList.remove('field-saved'), 1200);
    }
  } catch {
    showToast('Erreur lors de la sauvegarde', 'error');
  }
}

// ─── Modal indisponibilités ────────────────────────────────────
function openUnavailModal(car) {
  modalCarId = car.id;
  modalCarTitle.textContent = `${car.brand || ''} ${car.model || ''} — Périodes d'indisponibilité`;
  unavailFrom.value  = '';
  unavailTo.value    = '';
  unavailNotes.value = '';
  unavailModal.classList.remove('hidden');
  renderUnavailList();
}

function renderUnavailList() {
  const items = allUnavails
    .filter(u => u.car_id === modalCarId)
    .sort((a, b) => a.from_date.localeCompare(b.from_date));

  if (items.length === 0) {
    unavailList.innerHTML = '<div class="avail-empty">Aucune période d\'indisponibilité définie. Ce véhicule est disponible sur toutes les dates.</div>';
    return;
  }

  unavailList.innerHTML = '';
  items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'avail-item';
    div.innerHTML = `
      <div>
        <div class="avail-dates">🚫 ${fmtDate(item.from_date)} → ${fmtDate(item.to_date)}</div>
        ${item.notes ? `<div class="avail-notes">${esc(item.notes)}</div>` : ''}
      </div>
      <button class="btn btn-danger btn-del-unavail" data-id="${item.id}" style="font-size:.78rem;padding:5px 10px;flex-shrink:0">Supprimer</button>
    `;
    div.querySelector('.btn-del-unavail').addEventListener('click', () => deleteUnavail(item.id));
    unavailList.appendChild(div);
  });
}

async function handleAddUnavail() {
  const from  = unavailFrom.value;
  const to    = unavailTo.value;
  const notes = unavailNotes.value.trim();

  if (!from || !to) { showToast('Veuillez saisir les deux dates.', 'error'); return; }
  if (from > to)    { showToast('La date de début doit être avant la date de fin.', 'error'); return; }

  addUnavailBtn.textContent = 'Ajout…';
  addUnavailBtn.disabled = true;

  try {
    const res  = await authFetch('/api/v1/site-admin/unavailabilities', {
      method: 'POST',
      body: JSON.stringify({ car_id: modalCarId, from_date: from, to_date: to, notes: notes || null }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Erreur');

    allUnavails.push(json.data);
    unavailFrom.value  = '';
    unavailTo.value    = '';
    unavailNotes.value = '';
    renderUnavailList();
    refreshUnavailCell(modalCarId);
    showToast('Période d\'indisponibilité ajoutée.', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    addUnavailBtn.textContent = 'Ajouter cette période';
    addUnavailBtn.disabled = false;
  }
}

async function deleteUnavail(id) {
  try {
    const res = await authFetch(`/api/v1/site-admin/unavailabilities/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Erreur suppression');
    allUnavails = allUnavails.filter(u => u.id !== id);
    renderUnavailList();
    refreshUnavailCell(modalCarId);
    showToast('Période supprimée.', 'success');
  } catch {
    showToast('Erreur lors de la suppression', 'error');
  }
}

function refreshUnavailCell(carId) {
  const tr = carsTableBody.querySelector(`tr[data-car-id="${carId}"]`);
  if (!tr) return;
  const items = allUnavails.filter(u => u.car_id === carId);
  const cell  = tr.querySelector('.dispo-badge');
  if (cell) cell.outerHTML = buildUnavailBadge(items);
}

// ─── Helpers ──────────────────────────────────────────────────
function authFetch(path, opts = {}) {
  return fetch(`${API}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, ...(opts.headers || {}) },
  });
}

function fmtDate(d) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

let toastTimer;
function showToast(msg, type = 'info') {
  toastEl.textContent = msg;
  toastEl.className   = `toast toast-${type}`;
  clearTimeout(toastTimer);
  requestAnimationFrame(() => requestAnimationFrame(() => toastEl.classList.add('visible')));
  toastTimer = setTimeout(() => toastEl.classList.remove('visible'), 3000);
}
