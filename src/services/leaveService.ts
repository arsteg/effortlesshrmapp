import { apiService } from './api';
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

    // Legacy or specific report endpoint? 
    // The previous getLeaves mapped to '/leaves/get' which seems wrong based on Angular.
    // I will keep it deprecated or remove if unused effectively.
};
