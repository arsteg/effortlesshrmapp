import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_BASE_URL } from '../utils/constants';
import { getToken } from '../utils/storage';

class ApiService {
    private axiosInstance: AxiosInstance;
    private onLogout: (() => void) | null = null;

    constructor() {
        this.axiosInstance = axios.create({
            baseURL: API_BASE_URL,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Request interceptor
        this.axiosInstance.interceptors.request.use(
            async (config) => {
                const token = await getToken();
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
        this.axiosInstance.interceptors.response.use(
            (response) => response,
            async (error) => {
                if (error.response?.status === 401) {
                    // Handle unauthorized access
                    if (this.onLogout) {
                        this.onLogout();
                    }
                }
                return Promise.reject(error);
            }
        );
    }

    setLogoutCallback(callback: () => void) {
        this.onLogout = callback;
    }

    async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        try {
            const response: AxiosResponse<T> = await this.axiosInstance.get(url, config);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        try {
            const response: AxiosResponse<T> = await this.axiosInstance.post(url, data, config);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        try {
            const response: AxiosResponse<T> = await this.axiosInstance.put(url, data, config);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        try {
            const response: AxiosResponse<T> = await this.axiosInstance.delete(url, config);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    private handleError(error: any): Error {
        if (error.response) {
            // Server responded with error
            const message = error.response.data?.message || 'Server error occurred';
            return new Error(message);
        } else if (error.request) {
            // Request made but no response
            return new Error('No response from server. Please check your internet connection.');
        } else {
            // Something else happened
            return new Error(error.message || 'An unexpected error occurred');
        }
    }
}

export const apiService = new ApiService();
