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
    },

    // Team Management
    addSubordinate: async (managerId: string, subordinateId: string) => {
        return apiService.post('/auth/roles/addSubordinate', { userId: managerId, subordinateUserId: subordinateId });
    },

    deleteSubordinate: async (managerId: string, subordinateId: string) => {
        return apiService.delete(`/auth/roles/deleteSubordinate/${managerId}/${subordinateId}`);
    },

    getSubordinates: async (managerId: string) => {
        return apiService.get<ApiResponse<User[]>>(`/auth/roles/getSubordinates/${managerId}`);
    }
};
