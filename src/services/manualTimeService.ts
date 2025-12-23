import { apiService } from './api';
import { ApiResponse } from '../types';

export const manualTimeService = {
    getManualTimeRequestsByUser: async (userId: string, skip: string = '0', next: string = '10') => {
        return apiService.post<ApiResponse<any>>(`manualTime/getManualTimeRequests/${userId}`, { skip, next });
    },

    addManualTimeRequest: async (request: any) => {
        return apiService.post<ApiResponse<any>>('manualTime/addManualTimeRequest', request);
    },

    updateManualTimeRequest: async (request: any) => {
        return apiService.post<ApiResponse<any>>('manualTime/updateManualTimeRequest', request);
    },

    deleteManualTimeRequest: async (id: string) => {
        return apiService.delete<ApiResponse<any>>(`manualTime/manualTimeRequest/${id}`);
    },

    getManualTimeRequestsForApprovalByUser: async (userId: string) => {
        return apiService.get<ApiResponse<any>>(`manualTime/getManualTimeRequestsForApproval/${userId}`);
    }
};
