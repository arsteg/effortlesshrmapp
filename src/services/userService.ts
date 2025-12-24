import { apiService } from './api';
import { ApiResponse, User } from '../types';

export const userService = {
    getUsersByCompany: async (companyId: string) => {
        return apiService.get<ApiResponse<{ users: User[] }>>(`users/getUsersByCompany/${companyId}`);
    },

    getUsersByStatus: async (status: string) => {
        return apiService.get<ApiResponse<{ users: User[] }>>(`users/getUsersByStatus/${status}`);
    },

    getAllUsers: async () => {
        return apiService.get<ApiResponse<{ data: User[] }>>('users');
    }
};
