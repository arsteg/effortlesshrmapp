import { apiService } from './api';
import {
    LOGIN,
    FORGOT_PASSWORD,
    SIGNUP,
} from '../utils/constants';
import {
    LoginRequest,
    LoginResponse,
    ForgotPasswordRequest,
    RegisterRequest,
    BaseResponse,
} from '../types';

export const authService = {
    async login(credentials: LoginRequest): Promise<LoginResponse> {
        return await apiService.post<LoginResponse>(LOGIN, credentials);
    },

    async forgotPassword(data: ForgotPasswordRequest): Promise<BaseResponse> {
        return await apiService.post<BaseResponse>(FORGOT_PASSWORD, data);
    },

    async register(data: RegisterRequest): Promise<BaseResponse> {
        return await apiService.post<BaseResponse>(SIGNUP, data);
    },

    getUserManagers: async (userId: string) => {
        return apiService.get<any>(`users/getUserManagers/${userId}`);
    },

    getUserProjects: async (userId: string) => {
        return apiService.get<any>(`users/getUserProjects/${userId}`);
    },
};
