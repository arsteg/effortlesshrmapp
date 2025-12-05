import { apiService } from './api';

export interface AttendanceData {
    time: number;
    starttime: string;
    endtime: string;
    activity: string;
    firstName: string;
    lastName: string;
    manual: number;
    total: number;
    // Computed properties can be handled in the component or a helper
}

export interface AttendanceRequest {
    users?: string[];
    fromdate: string;
    todate: string;
}

export const attendanceService = {
    getAttendance: async (req: AttendanceRequest) => {
        return apiService.post<AttendanceData[]>('/attendance/get', req);
    },
    clockIn: async (data: { latitude?: number; longitude?: number; address?: string }) => {
        return apiService.post('/attendance/clock-in', data);
    },
    clockOut: async (data: { latitude?: number; longitude?: number; address?: string }) => {
        return apiService.post('/attendance/clock-out', data);
    },
    getTodayStatus: async (userId: string) => {
        return apiService.get<{ inTime: string | null; outTime: string | null; status: 'In' | 'Out' }>(`/attendance/status/${userId}`);
    },
};
