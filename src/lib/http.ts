import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { APP_CONFIG, ERROR_MESSAGES } from '@/config/constants';

class HttpClient {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: APP_CONFIG.API_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.instance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem(APP_CONFIG.AUTH.TOKEN_KEY);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.instance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          switch (error.response.status) {
            case 401:
              localStorage.removeItem(APP_CONFIG.AUTH.TOKEN_KEY);
              localStorage.removeItem(APP_CONFIG.AUTH.USER_KEY);
              window.location.href = '/login';
              break;
            case 403:
              console.error(ERROR_MESSAGES.AUTH.FORBIDDEN);
              break;
            case 404:
              console.error(ERROR_MESSAGES.API.NOT_FOUND);
              break;
            case 500:
              console.error(ERROR_MESSAGES.API.SERVER_ERROR);
              break;
            default:
              console.error(error.response.data.message || ERROR_MESSAGES.API.SERVER_ERROR);
          }
        } else if (error.request) {
          console.error(ERROR_MESSAGES.API.NETWORK_ERROR);
        } else {
          console.error(error.message);
        }
        return Promise.reject(error);
      }
    );
  }

  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.get<T>(url, config);
    return response.data;
  }

  public async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.post<T>(url, data, config);
    return response.data;
  }

  public async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.put<T>(url, data, config);
    return response.data;
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.delete<T>(url, config);
    return response.data;
  }

  public async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.patch<T>(url, data, config);
    return response.data;
  }
}

export const httpClient = new HttpClient(); 