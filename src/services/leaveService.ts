import { apiService } from './api';
import { ApiResponse } from '../types';
import { AttendanceRequest } from './attendanceService'; // Reusing BaseRequestModel equivalent

export interface LeaveData {
    name: string;
    firstName: string;
    lastName: string;
    count: number;
    // Computed properties
    fullName?: string;
}

export const leaveService = {
    getLeaveApplicationList: async (req: any) => { // Admin list
        return apiService.post<ApiResponse<any>>('Leave/employee-leave-application-list', req);
    },

    getLeaveApplicationByUser: async (userId: string, req: any) => { // User list
        return apiService.post<ApiResponse<any>>(`Leave/employee-leave-application-by-user/${userId}`, req);
    },

    getLeaveCategoriesByUser: async (userId: string) => {
        return apiService.get<any>(`leave/leave-categories-by-userv1/${userId}`);
    },

    addLeaveApplication: async (data: any) => {
        return apiService.post<ApiResponse<any>>('Leave/employee-leave-application', data);
    },

    getLeaveApplicationByTeam: async (req: any) => {
        return apiService.post<ApiResponse<any>>('Leave/employee-leave-application-by-team', req);
    },

    updateLeaveApplication: async (id: string, data: any) => {
        return apiService.put<ApiResponse<any>>(`Leave/employee-leave-application/${id}`, data);
    },

    deleteLeaveApplication: async (id: string) => {
        return apiService.delete<ApiResponse<any>>(`Leave/employee-leave-application/${id}`);
    }
};
