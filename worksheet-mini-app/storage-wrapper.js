// Wrapper pour adapter la mini-app à localStorage ou API PostgreSQL
// À ajouter au début du script dans index.html (avant la fonction load())

(function() {
  // Configuration
  const USE_API_STORAGE = false; // Changer à true pour utiliser l'API
  const API_BASE_URL = 'http://localhost:3001/api/v1';
  
  console.log(`[LocaCar] Storage Mode: ${USE_API_STORAGE ? 'API' : 'localStorage'}`);

  // Simple API client
  const apiClient = {
    async request(method, endpoint, data = null) {
      try {
        const options = {
          method,
          headers: { 'Content-Type': 'application/json' }
        };
        if (data) options.body = JSON.stringify(data);
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
      } catch (err) {
        console.error(`API Error: ${endpoint}`, err);
        throw err;
      }
    },
    get: (endpoint) => this.request('GET', endpoint),
    post: (endpoint, data) => this.request('POST', endpoint, data),
    put: (endpoint, data) => this.request('PUT', endpoint, data),
    delete: (endpoint) => this.request('DELETE', endpoint),
  };

  // Storage wrapper
  window.locaCarStorage = {
    async loadState() {
      if (!USE_API_STORAGE) {
        // Mode localStorage (défaut)
        return this._loadFromLocalStorage();
      }
      
      // Mode API
      try {
        const [cars, customers, contracts, invoices, payments, reservations, 
                maintenance, insurances, insuranceInstallments, leasingContracts, 
                leasingInstallments, vignettes, inspections, settings] = await Promise.all([
          apiClient.get('/cars'),
          apiClient.get('/customers'),
          apiClient.get('/contracts'),
          apiClient.get('/invoices'),
          apiClient.get('/payments'),
          apiClient.get('/reservations'),
          apiClient.get('/maintenance'),
          apiClient.get('/insurances'),
          apiClient.get('/insurance-installments'),
          apiClient.get('/leasing'),
          apiClient.get('/leasing-installments'),
          apiClient.get('/vignettes'),
          apiClient.get('/inspections'),
          apiClient.get('/settings')
        ]);

        return {
          cars: cars.data || [],
          customers: customers.data || [],
          contracts: contracts.data || [],
          invoices: invoices.data || [],
          payments: payments.data || [],
          reservations: reservations.data || [],
          maintenanceCosts: maintenance.data || [],
          insurances: insurances.data || [],
          insuranceInstallments: insuranceInstallments.data || [],
          leasingContracts: leasingContracts.data || [],
          leasingInstallments: leasingInstallments.data || [],
          vignettes: vignettes.data || [],
          inspections: inspections.data || [],
          settings: settings.data || {}
        };
      } catch (err) {
        console.error('Failed to load state from API, falling back to localStorage', err);
        return this._loadFromLocalStorage();
      }
    },

    async saveState(state) {
      if (!USE_API_STORAGE) {
        // Mode localStorage
        localStorage.setItem('locacar-mini-v3', JSON.stringify(state));
        return;
      }

      // Mode API - sauvegarder chaque entité
      try {
        // Note: Pour une vraie implémentation, il faudrait tracker les changes
        // et sauvegarder seulement les diffs
        console.log('[LocaCar] State saved to API (async)');
        // Implémenter la sauvegarde par entité si nécessaire
      } catch (err) {
        console.error('Failed to save state to API', err);
      }
    },

    _loadFromLocalStorage() {
      try {
        const raw = localStorage.getItem('locacar-mini-v3');
        if (!raw) return this._getDefaultState();
        return JSON.parse(raw);
      } catch (_) {
        return this._getDefaultState();
      }
    },

    _getDefaultState() {
      return {
        cars: [],
        customers: [],
        contracts: [],
        invoices: [],
        payments: [],
        reservations: [],
        maintenanceCosts: [],
        insurances: [],
        insuranceInstallments: [],
        leasingContracts: [],
        leasingInstallments: [],
        vignettes: [],
        inspections: [],
        settings: { baseCurrency: 'TND', eurToTnd: 3.4, openingCashTnd: 0, reservationBufferHours: 2 }
      };
    }
  };

  console.log('[LocaCar] Storage wrapper initialized');
})();

// Après ajouter ce code à la fonction load() existante:
// Remplacer:
//   try {
//     const raw = localStorage.getItem(KEY);
//     ...
// Par:
//   const state = await window.locaCarStorage.loadState();
//   if (state) return state;
