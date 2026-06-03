// API Storage Layer - Replaces localStorage with backend API
// This file should be loaded BEFORE the main script in index.html

const USE_API = true; // Switch between API and localStorage
const API_BASE_URL = 'http://localhost:3001/api/v1';
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000;

// Simple API client
class APIClient {
  static async request(method, endpoint, data = null) {
    for (let attempt = 0; attempt < RETRY_ATTEMPTS; attempt++) {
      try {
        const options = {
          method,
          headers: { 'Content-Type': 'application/json' }
        };
        if (data) options.body = JSON.stringify(data);
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        if (!response.ok) {
          if (response.status === 503 && attempt < RETRY_ATTEMPTS - 1) {
            await new Promise(r => setTimeout(r, RETRY_DELAY * (attempt + 1)));
            continue;
          }
          throw new Error(`HTTP ${response.status}`);
        }
        return await response.json();
      } catch (err) {
        if (attempt === RETRY_ATTEMPTS - 1) throw err;
        await new Promise(r => setTimeout(r, RETRY_DELAY));
      }
    }
  }

  static get(endpoint) { return this.request('GET', endpoint); }
  static post(endpoint, data) { return this.request('POST', endpoint, data); }
  static put(endpoint, data) { return this.request('PUT', endpoint, data); }
  static delete(endpoint) { return this.request('DELETE', endpoint); }
}

// Storage adapter
class StorageAdapter {
  static async getAll(entity) {
    try {
      if (!USE_API) {
        const stored = localStorage.getItem(`locacar-${entity}`) || '[]';
        return JSON.parse(stored);
      }
      const response = await APIClient.get(`/${entity}`);
      return response.data || [];
    } catch (err) {
      console.warn(`Failed to get ${entity}:`, err);
      return [];
    }
  }

  static async getOne(entity, id) {
    try {
      if (!USE_API) {
        const items = await this.getAll(entity);
        return items.find(i => i.id === id) || null;
      }
      const response = await APIClient.get(`/${entity}/${id}`);
      return response.data || null;
    } catch (err) {
      console.warn(`Failed to get ${entity} ${id}:`, err);
      return null;
    }
  }

  static async create(entity, data) {
    try {
      if (!USE_API) {
        const items = await this.getAll(entity);
        items.push(data);
        localStorage.setItem(`locacar-${entity}`, JSON.stringify(items));
        return data;
      }
      const response = await APIClient.post(`/${entity}`, data);
      return response.data || data;
    } catch (err) {
      console.warn(`Failed to create ${entity}:`, err);
      return data;
    }
  }

  static async update(entity, id, data) {
    try {
      if (!USE_API) {
        const items = await this.getAll(entity);
        const idx = items.findIndex(i => i.id === id);
        if (idx >= 0) items[idx] = { ...items[idx], ...data };
        localStorage.setItem(`locacar-${entity}`, JSON.stringify(items));
        return items[idx] || data;
      }
      const response = await APIClient.put(`/${entity}/${id}`, data);
      return response.data || data;
    } catch (err) {
      console.warn(`Failed to update ${entity} ${id}:`, err);
      return data;
    }
  }

  static async delete(entity, id) {
    try {
      if (!USE_API) {
        const items = await this.getAll(entity);
        const filtered = items.filter(i => i.id !== id);
        localStorage.setItem(`locacar-${entity}`, JSON.stringify(filtered));
        return true;
      }
      await APIClient.delete(`/${entity}/${id}`);
      return true;
    } catch (err) {
      console.warn(`Failed to delete ${entity} ${id}:`, err);
      return false;
    }
  }

  static async getSettings() {
    try {
      if (!USE_API) {
        const stored = localStorage.getItem('locacar-settings') || '{}';
        return JSON.parse(stored);
      }
      const response = await APIClient.get('/settings');
      return response.data || {};
    } catch (err) {
      console.warn('Failed to get settings:', err);
      return {};
    }
  }

  static async saveSettings(settings) {
    try {
      if (!USE_API) {
        localStorage.setItem('locacar-settings', JSON.stringify(settings));
        return settings;
      }
      const response = await APIClient.put('/settings', settings);
      return response.data || settings;
    } catch (err) {
      console.warn('Failed to save settings:', err);
      return settings;
    }
  }
}

// Override window storage for backward compatibility
if (USE_API) {
  console.log('[LocaCar] Using API storage instead of localStorage');
  window.StorageAdapter = StorageAdapter;
}
