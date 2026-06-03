import axios, { AxiosInstance } from 'axios';

export class PostgresqlCompatibleClient {
  private axios: AxiosInstance;

  constructor(url: string, key: string) {
    this.axios = axios.create({
      baseURL: `${url}/rest/v1`,
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async query(sql: string, params: any[] = []): Promise<any> {
    throw new Error('Direct SQL not supported. Use REST API methods instead.');
  }

  async get(endpoint: string, config?: any): Promise<any> {
    return this.axios.get(endpoint, config);
  }

  async post(endpoint: string, data: any, config?: any): Promise<any> {
    return this.axios.post(endpoint, data, config);
  }

  async patch(endpoint: string, data: any, config?: any): Promise<any> {
    return this.axios.patch(endpoint, data, config);
  }

  async delete(endpoint: string, config?: any): Promise<any> {
    return this.axios.delete(endpoint, config);
  }

  async request(method: string, endpoint: string, data?: any, config?: any): Promise<any> {
    return this.axios.request({ method, url: endpoint, data, ...config });
  }
}
