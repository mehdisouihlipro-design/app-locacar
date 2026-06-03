// API Client for LocaCar
// Call this from the browser to replace localStorage with backend API calls

const API_BASE_URL = 'http://localhost:3001/api/v1';

class LocaCarAPI {
  static async get(endpoint) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
  }

  static async post(endpoint, data) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
  }

  static async put(endpoint, data) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
  }

  static async delete(endpoint) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
  }

  // Cars
  static cars = {
    getAll: () => LocaCarAPI.get('/cars'),
    get: (id) => LocaCarAPI.get(`/cars/${id}`),
    create: (data) => LocaCarAPI.post('/cars', data),
    update: (id, data) => LocaCarAPI.put(`/cars/${id}`, data),
    delete: (id) => LocaCarAPI.delete(`/cars/${id}`),
    updateGPS: (id, gpsData) => LocaCarAPI.patch(`/cars/${id}/gps`, gpsData)
  };

  // Customers
  static customers = {
    getAll: () => LocaCarAPI.get('/customers'),
    get: (id) => LocaCarAPI.get(`/customers/${id}`),
    create: (data) => LocaCarAPI.post('/customers', data),
    update: (id, data) => LocaCarAPI.put(`/customers/${id}`, data),
    delete: (id) => LocaCarAPI.delete(`/customers/${id}`)
  };

  // Contracts
  static contracts = {
    getAll: () => LocaCarAPI.get('/contracts'),
    get: (id) => LocaCarAPI.get(`/contracts/${id}`),
    create: (data) => LocaCarAPI.post('/contracts', data),
    update: (id, data) => LocaCarAPI.put(`/contracts/${id}`, data),
    delete: (id) => LocaCarAPI.delete(`/contracts/${id}`)
  };

  // Invoices
  static invoices = {
    getAll: () => LocaCarAPI.get('/invoices'),
    get: (id) => LocaCarAPI.get(`/invoices/${id}`),
    create: (data) => LocaCarAPI.post('/invoices', data),
    update: (id, data) => LocaCarAPI.put(`/invoices/${id}`, data),
    delete: (id) => LocaCarAPI.delete(`/invoices/${id}`)
  };

  // Payments
  static payments = {
    getAll: () => LocaCarAPI.get('/payments'),
    create: (data) => LocaCarAPI.post('/payments', data),
    delete: (id) => LocaCarAPI.delete(`/payments/${id}`)
  };

  // Reservations
  static reservations = {
    getAll: () => LocaCarAPI.get('/reservations'),
    get: (id) => LocaCarAPI.get(`/reservations/${id}`),
    create: (data) => LocaCarAPI.post('/reservations', data),
    update: (id, data) => LocaCarAPI.put(`/reservations/${id}`, data),
    delete: (id) => LocaCarAPI.delete(`/reservations/${id}`)
  };

  // Maintenance
  static maintenance = {
    getAll: () => LocaCarAPI.get('/maintenance'),
    create: (data) => LocaCarAPI.post('/maintenance', data),
    delete: (id) => LocaCarAPI.delete(`/maintenance/${id}`)
  };

  // Inspections
  static inspections = {
    getAll: () => LocaCarAPI.get('/inspections'),
    get: (id) => LocaCarAPI.get(`/inspections/${id}`),
    create: (data) => LocaCarAPI.post('/inspections', data),
    delete: (id) => LocaCarAPI.delete(`/inspections/${id}`)
  };

  // Insurances
  static insurances = {
    getAll: () => LocaCarAPI.get('/insurances'),
    create: (data) => LocaCarAPI.post('/insurances', data),
    delete: (id) => LocaCarAPI.delete(`/insurances/${id}`)
  };

  // Leasing
  static leasing = {
    getAll: () => LocaCarAPI.get('/leasing'),
    create: (data) => LocaCarAPI.post('/leasing', data),
    delete: (id) => LocaCarAPI.delete(`/leasing/${id}`)
  };

  // Vignettes
  static vignettes = {
    getAll: () => LocaCarAPI.get('/vignettes'),
    create: (data) => LocaCarAPI.post('/vignettes', data),
    delete: (id) => LocaCarAPI.delete(`/vignettes/${id}`)
  };

  // Settings
  static settings = {
    get: () => LocaCarAPI.get('/settings'),
    update: (data) => LocaCarAPI.put('/settings', data)
  };
}

// Export for use in browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LocaCarAPI;
}
