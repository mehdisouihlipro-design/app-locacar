import axios, { AxiosInstance } from 'axios';

export class SupabaseRestClient {
  private client: AxiosInstance;

  constructor(url: string, key: string) {
    this.client = axios.create({
      baseURL: `${url}/rest/v1`,
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * SELECT - Get records
   * @param table Table name
   * @param query Query string (e.g., 'id=eq.123&status=eq.active')
   */
  async select(table: string, query?: string) {
    const url = query ? `/${table}?${query}` : `/${table}`;
    const response = await this.client.get(url);
    return response.data;
  }

  /**
   * INSERT - Create records
   * @param table Table name
   * @param data Data to insert
   */
  async insert(table: string, data: Record<string, any>) {
    const response = await this.client.post(`/${table}`, data, {
      headers: { 'Prefer': 'return=representation' }
    });
    return response.data;
  }

  /**
   * UPDATE - Update records
   * @param table Table name
   * @param query Query string for WHERE clause (e.g., 'id=eq.123')
   * @param data Data to update
   */
  async update(table: string, query: string, data: Record<string, any>) {
    const response = await this.client.patch(`/${table}?${query}`, data, {
      headers: { 'Prefer': 'return=representation' }
    });
    return response.data;
  }

  /**
   * DELETE - Delete records
   * @param table Table name
   * @param query Query string for WHERE clause (e.g., 'id=eq.123')
   */
  async delete(table: string, query: string) {
    await this.client.delete(`/${table}?${query}`);
  }

  /**
   * COUNT - Count records
   * @param table Table name
   * @param query Optional query string
   */
  async count(table: string, query?: string) {
    const url = query ? `/${table}?${query}&select=count()` : `/${table}?select=count()`;
    const response = await this.client.get(url, {
      headers: { 'Prefer': 'count=exact' }
    });
    return parseInt(response.headers['content-range']?.split('/')[1] || '0');
  }

  /**
   * Raw request
   */
  async request(method: string, path: string, data?: any) {
    return this.client.request({ method, url: path, data });
  }
}
