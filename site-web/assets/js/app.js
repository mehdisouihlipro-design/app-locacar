// ============================================================
// LocaCar — Portail Client · Lot 1
// Consultation des véhicules disponibles
// ============================================================

const CONFIG = {
  API_URL: (window.SITE_API_URL || 'http://localhost:3001').replace(/\/$/, ''),
};

const FUEL_LABELS = {
  essence:    'Essence',
  diesel:     'Diesel',
  electrique: 'Électrique',
  électrique: 'Électrique',
  hybride:    'Hybride',
  gpl:        'GPL',
  hydrogene:  'Hydrogène',
  hydrogène:  'Hydrogène',
};

const FUEL_ICONS = {
  essence:    '⛽',
  diesel:     '⛽',
  electrique: '⚡',
  électrique: '⚡',
  hybride:    '🔋',
  gpl:        '💧',
};

const COLOR_MAP = {
  blanc:    '#F2F2F2', blanche: '#F2F2F2',
  noir:     '#1C1C1E', noire:   '#1C1C1E',
  gris:     '#8E8E93', grise:   '#8E8E93',
  argent:   '#C7C7CC', silver:  '#C7C7CC',
  rouge:    '#FF3B30', rouge:   '#FF3B30',
  bleu:     '#007AFF', bleue:   '#007AFF',
  vert:     '#34C759', verte:   '#34C759',
  jaune:    '#FFD60A',
  orange:   '#FF9500',
  marron:   '#795548', marrone: '#795548',
  beige:    '#F0E6D3',
  bordeaux: '#800020',
  violet:   '#AF52DE', mauve:   '#AF52DE',
};

// ─── État global ─────────────────────────────────────────────
let allCars            = [];
let activeFuelFilter   = 'all';
let activeLocFilter    = 'all';

// ─── DOM refs ────────────────────────────────────────────────
const searchFromInput  = document.getElementById('searchFrom');
const searchToInput    = document.getElementById('searchTo');
const searchBtn        = document.getElementById('searchBtn');
const carsGrid         = document.getElementById('carsGrid');
const resultsCount     = document.getElementById('resultsCount');
const loadingState     = document.getElementById('loadingState');
const emptyState       = document.getElementById('emptyState');
const errorState       = document.getElementById('errorState');
const fuelFilterBar    = document.getElementById('fuelFilterBar');
const locationFilter   = document.getElementById('locationFilter');

// ─── Initialisation ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const today = new Date().toISOString().split('T')[0];
  searchFromInput.min = today;
  searchToInput.min   = today;

  searchFromInput.addEventListener('change', () => {
    if (searchFromInput.value) {
      searchToInput.min = searchFromInput.value;
      if (searchToInput.value && searchToInput.value < searchFromInput.value) {
        searchToInput.value = '';
      }
    }
  });

  searchBtn.addEventListener('click', handleSearch);

  locationFilter.addEventListener('change', () => {
    activeLocFilter = locationFilter.value;
    applyFilters();
  });

  fetchCars();
});

// ─── Fetch ───────────────────────────────────────────────────
async function fetchCars(from = null, to = null) {
  showLoading(true);
  hideError();

  try {
    let url = `${CONFIG.API_URL}/api/v1/public/cars`;
    if (from && to) url += `?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;

    const res = await fetch(url);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || `HTTP ${res.status}`);
    }
    const json = await res.json();
    allCars = json.data || [];

    buildFuelFilter(allCars);
    buildLocationFilter(allCars);
    applyFilters();
  } catch (err) {
    console.error('[LocaCar] Erreur chargement:', err.message);
    showError('Impossible de charger les véhicules. Vérifiez votre connexion ou réessayez plus tard.');
  } finally {
    showLoading(false);
  }
}

// ─── Recherche ───────────────────────────────────────────────
function handleSearch() {
  const from = searchFromInput.value;
  const to   = searchToInput.value;

  if (!from || !to) {
    showToast('Veuillez sélectionner les dates de départ et de retour.', 'warning');
    return;
  }
  if (from >= to) {
    showToast('La date de retour doit être après la date de départ.', 'warning');
    return;
  }
  fetchCars(from, to);
}

// ─── Filtres ─────────────────────────────────────────────────
function buildFuelFilter(cars) {
  const fuels = [...new Set(
    cars.map(c => normFuel(c.fuel_type)).filter(Boolean)
  )].sort();

  fuelFilterBar.innerHTML = '';

  const allChip = makeChip('Tous', 'all', true);
  allChip.addEventListener('click', () => setFuelFilter('all', allChip));
  fuelFilterBar.appendChild(allChip);

  fuels.forEach(fuel => {
    const icon  = FUEL_ICONS[fuel]  || '⛽';
    const label = FUEL_LABELS[fuel] || cap(fuel);
    const chip  = makeChip(`${icon} ${label}`, fuel, false);
    chip.addEventListener('click', () => setFuelFilter(fuel, chip));
    fuelFilterBar.appendChild(chip);
  });
}

function buildLocationFilter(cars) {
  const locs = [...new Set(cars.map(c => c.location).filter(Boolean))].sort();
  locationFilter.innerHTML = '<option value="all">Toutes les agences</option>';
  locs.forEach(loc => {
    const opt    = document.createElement('option');
    opt.value    = loc;
    opt.textContent = loc;
    locationFilter.appendChild(opt);
  });
}

function setFuelFilter(fuel, chipEl) {
  activeFuelFilter = fuel;
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  chipEl.classList.add('active');
  applyFilters();
}

function makeChip(label, value, active) {
  const btn = document.createElement('button');
  btn.className   = 'filter-chip' + (active ? ' active' : '');
  btn.dataset.val = value;
  btn.textContent = label;
  return btn;
}

function applyFilters() {
  let list = allCars;
  if (activeFuelFilter !== 'all') {
    list = list.filter(c => normFuel(c.fuel_type) === activeFuelFilter);
  }
  if (activeLocFilter !== 'all') {
    list = list.filter(c => c.location === activeLocFilter);
  }
  renderCars(list);
}

// ─── Rendu ───────────────────────────────────────────────────
function renderCars(cars) {
  carsGrid.innerHTML = '';

  if (cars.length === 0) {
    emptyState.classList.remove('hidden');
    resultsCount.textContent = 'Aucun véhicule disponible';
    return;
  }

  emptyState.classList.add('hidden');

  const from = searchFromInput.value;
  const to   = searchToInput.value;
  const datesLabel = (from && to) ? ` · du ${fmtDate(from)} au ${fmtDate(to)}` : '';
  resultsCount.textContent = `${cars.length} véhicule${cars.length > 1 ? 's' : ''} disponible${cars.length > 1 ? 's' : ''}${datesLabel}`;

  cars.forEach(car => carsGrid.appendChild(buildCard(car)));
}

function buildCard(car) {
  const card       = document.createElement('div');
  card.className   = 'car-card';

  const bodyColor  = getCarColor(car.color);
  const darkColor  = darkenHex(bodyColor, 48);
  const fuelNorm   = normFuel(car.fuel_type);
  const fuelLabel  = FUEL_LABELS[fuelNorm] || cap(car.fuel_type || 'N/A');
  const fuelIcon   = FUEL_ICONS[fuelNorm]  || '⛽';
  const colorLight = isLightColor(bodyColor);

  const visualHtml = car.photo_url
    ? `<img src="${esc(car.photo_url)}" class="car-photo" alt="${esc(car.brand || '')} ${esc(car.model || '')}"
           onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">${buildCarSVG(bodyColor, darkColor)}`
    : buildCarSVG(bodyColor, darkColor);

  const priceHtml = car.site_price_day != null
    ? `<div class="car-price">${Number(car.site_price_day).toLocaleString('fr-FR', { minimumFractionDigits: 0 })} <span>TND / jour</span></div>`
    : '';

  card.innerHTML = `
    <div class="car-visual">
      ${visualHtml}
      <div class="car-badges">
        <span class="badge badge-fuel">${fuelIcon} ${esc(fuelLabel)}</span>
        ${car.color ? `<span class="badge badge-color" style="background:${bodyColor};border:1px solid rgba(0,0,0,.13);color:${colorLight ? '#333' : '#fff'}">${esc(car.color)}</span>` : ''}
      </div>
    </div>
    <div class="car-info">
      <div class="car-brand">${esc(car.brand || '')}</div>
      <div class="car-model">${esc(car.model || 'Modèle inconnu')}</div>
      ${priceHtml}
      <div class="car-details">
        ${car.location    ? `<span class="detail-item">📍 ${esc(car.location)}</span>`                                    : ''}
        ${car.fuel_type   ? `<span class="detail-item">⛽ ${esc(fuelLabel)}</span>`                                       : ''}
        ${car.odometer_km != null ? `<span class="detail-item">🔄 ${Number(car.odometer_km).toLocaleString('fr-FR')} km</span>` : ''}
      </div>
      <div class="car-status">
        <span class="status-dot"></span>
        <span class="status-label">Disponible</span>
      </div>
      <button class="btn-reserve" disabled title="Réservation en ligne disponible prochainement — Lot 2">
        🔒 Réservation en ligne — Bientôt
      </button>
    </div>
  `;
  return card;
}

function buildCarSVG(color, dark) {
  const glass = '#BDE3F5';
  return `<svg viewBox="0 0 120 65" xmlns="http://www.w3.org/2000/svg" class="car-svg" aria-hidden="true">
    <ellipse cx="60" cy="62" rx="50" ry="4" fill="rgba(0,0,0,0.1)"/>
    <rect x="8" y="36" width="104" height="20" rx="5" fill="${color}"/>
    <path d="M32 36 C35 18 44 10 56 10 L78 10 C90 10 96 18 100 36 Z" fill="${color}"/>
    <path d="M97 35 C94 20 88 13 78 12 L76 12 C85 13 91 20 94 35 Z" fill="${glass}" opacity="0.85"/>
    <path d="M35 35 C38 20 44 13 54 12 L56 12 C46 13 40 20 37 35 Z" fill="${glass}" opacity="0.85"/>
    <path d="M39 34 L41 14 L60 11 L61 34 Z" fill="${glass}" opacity="0.8"/>
    <path d="M63 34 L62 11 L77 12 L93 34 Z" fill="${glass}" opacity="0.8"/>
    <rect x="61" y="11" width="2" height="23" rx="1" fill="${dark}"/>
    <line x1="62" y1="36" x2="62" y2="56" stroke="${dark}" stroke-width="0.8"/>
    <circle cx="86" cy="56" r="13" fill="#2D2D2D"/>
    <circle cx="86" cy="56" r="8"  fill="#545454"/>
    <circle cx="86" cy="56" r="3.5" fill="#888"/>
    <circle cx="34" cy="56" r="13" fill="#2D2D2D"/>
    <circle cx="34" cy="56" r="8"  fill="#545454"/>
    <circle cx="34" cy="56" r="3.5" fill="#888"/>
    <rect x="109" y="39" width="7" height="5" rx="1.5" fill="#FFF3C4"/>
    <rect x="4"   y="39" width="7" height="5" rx="1.5" fill="#FECACA"/>
    <rect x="107" y="46" width="6" height="9" rx="2" fill="${dark}"/>
    <rect x="7"   y="46" width="6" height="9" rx="2" fill="${dark}"/>
  </svg>`;
}

// ─── Utilitaires ─────────────────────────────────────────────
function getCarColor(name) {
  if (!name) return '#9E9E9E';
  const norm = name.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '');
  for (const [k, v] of Object.entries(COLOR_MAP)) {
    const nk = k.normalize('NFD').replace(/[̀-ͯ]/g, '');
    if (norm.includes(nk) || nk.includes(norm)) return v;
  }
  return '#9E9E9E';
}

function darkenHex(hex, amt) {
  if (!hex || !hex.startsWith('#') || hex.length < 7) return '#555';
  const r = Math.max(0, parseInt(hex.slice(1,3), 16) - amt);
  const g = Math.max(0, parseInt(hex.slice(3,5), 16) - amt);
  const b = Math.max(0, parseInt(hex.slice(5,7), 16) - amt);
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

function isLightColor(hex) {
  if (!hex || !hex.startsWith('#') || hex.length < 7) return true;
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return (r * 0.299 + g * 0.587 + b * 0.114) > 180;
}

function normFuel(val) {
  return (val || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}

function fmtDate(d) {
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function showLoading(show) {
  loadingState.classList.toggle('hidden', !show);
  carsGrid.classList.toggle('hidden', show);
}

function hideError() { errorState.classList.add('hidden'); }

function showError(msg) {
  errorState.textContent = msg;
  errorState.classList.remove('hidden');
  carsGrid.classList.add('hidden');
  emptyState.classList.add('hidden');
}

function showToast(msg, type = 'info') {
  const t = document.createElement('div');
  t.className   = `toast toast-${type}`;
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('visible')));
  setTimeout(() => {
    t.classList.remove('visible');
    setTimeout(() => t.remove(), 320);
  }, 3200);
}
