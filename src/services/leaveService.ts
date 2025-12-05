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
    getLeaves: async (req: AttendanceRequest) => {
        return apiService.post<LeaveData[]>('/leaves/get', req); // Assuming endpoint
    },
};
