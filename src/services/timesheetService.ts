import { apiService } from './api';
import { ApiResponse } from '../types';

export interface TimesheetRequest {
    userId: string;
    startDate: string;
    endDate: string;
}

export interface AdminTimesheetRequest {
    userIds: string[];  // Note: API expects "userIds" as comma-separated string or array? 
    // Angular: {"userIds" :userId, ...} where userId seems to be a single string or comma joined
    startDate: string;
    endDate: string;
}

// Based on Angular's timeLogService.ts
// getUserTimeSheet: post to /timelogs/timesheet with {userId, startDate, endDate}
// geAdminTimeSheet: post to /timelogs/timesheets with {userIds, startDate, endDate}

export const timesheetService = {
    getUserTimeSheet: async (userId: string, startDate: string, endDate: string) => {
        return apiService.post<ApiResponse<any>>('timelogs/timesheet', {
            userId,
            startDate,
            endDate
        });
    },

    getAdminTimeSheet: async (userIds: string | string[], startDate: string, endDate: string) => {
        // If userIds is array, join them if the API expects a comma-separated string, 
        // OR pass as is if API expects array. 
        // Angular service passes: {"userIds" :userId, ...}
        // Let's assume it handles string (comma separated) or single ID.
        const ids = Array.isArray(userIds) ? userIds.join(',') : userIds;

        return apiService.post<ApiResponse<any>>('timelogs/timesheets', {
            userIds: ids,
            startDate,
            endDate
        });
    },

    // Re-using existing endpoints if needed, or define specific ones
    getSubordinates: async (userId: string) => {
        return apiService.get<any>(`auth/roles/getSubordinates/${userId}`);
    },

    getUsersByIds: async (userIds: string[]) => {
        return apiService.post<ApiResponse<any>>('users/getUsers', { userId: userIds });
    },

    getAllUsers: async () => {
        // You might need an endpoint to get all users for Admin if subordinates aren't enough
        // Using a common one if available, otherwise defaulting to subordinates for now
        return apiService.get<any>('users'); // Verify if this endpoint exists/is correct later
    }
};
