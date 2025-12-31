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

export interface OfficeData {
    name: string;
    latitude: number;
    longitude: number;
    geofence_radius: number;
}

export interface AttendanceRuleData {
    officeId: string;
    selfie_required: boolean;
    face_recognition_enabled: boolean;
    face_match_threshold: number;
}

export const attendanceService = {
    // User Attendance Actions
    getAttendance: async (req: AttendanceRequest) => {
        return apiService.post<AttendanceData[]>('/attendance/get', req);
    },
    clockIn: async (data: { officeId: string; latitude: number; longitude: number; selfieUrl?: string; deviceId?: string; company?: string }) => {
        return apiService.post('/attendance/check-in', data);
    },
    clockOut: async (data: { officeId?: string; latitude: number; longitude: number; company?: string }) => {
        return apiService.post('/attendance/check-out', data);
    },
    getTodayStatus: async (userId: string) => {
        return apiService.get<{ inTime: string | null; outTime: string | null; status: 'In' | 'Out' }>(`/attendance/status/${userId}`);
    },
    getHistory: async (params?: { company?: string }) => {
        const query = params?.company ? `?company=${params.company}` : '';
        return apiService.get<any>(`/attendance/history${query}`);
    },

    // Manual Attendance Requests
    requestManualAttendance: async (data: {
        date: string;
        reason: string;
        checkInTime?: string;
        checkOutTime?: string;
        photoUrl?: string;
        userId: string;
        company: string;
        managerId: string;
    }) => {
        return apiService.post('/attendance/manual-request', data);
    },
    getManagers: async () => {
        return apiService.get<any>('/auth/roles/getManagers');
    },
    getManualAttendanceRequests: async (params?: { status?: string; fromDate?: string; toDate?: string; user?: string }) => {
        let query = '';
        if (params) {
            const parts = [];
            if (params.status) parts.push(`status=${params.status}`);
            if (params.fromDate) parts.push(`fromDate=${params.fromDate}`);
            if (params.toDate) parts.push(`toDate=${params.toDate}`);
            if (params.user) parts.push(`user=${params.user}`);
            if (parts.length > 0) query = `?${parts.join('&')}`;
        }
        return apiService.get<any>(`/attendance/manual-requests${query}`);
    },
    getManualAttendanceRequestById: async (id: string) => {
        return apiService.get<any>(`/attendance/manual-requests/${id}`);
    },
    approveManualAttendance: async (data: { requestId: string; status: 'approved' | 'rejected' }) => {
        return apiService.post('/attendance/manual-requests/approve', data);
    },

    // Office Management (Admin)
    getOffices: async (params?: { company?: string }) => {
        const query = params?.company ? `?company=${params.company}` : '';
        return apiService.get<any>(`/attendance/offices${query}`);
    },
    getOfficeById: async (id: string) => {
        return apiService.get<any>(`/attendance/offices/${id}`);
    },
    createOffice: async (data: OfficeData) => {
        return apiService.post('/attendance/offices', data);
    },
    updateOffice: async (id: string, data: Partial<OfficeData>) => {
        return apiService.put(`/attendance/offices/${id}`, data);
    },
    deleteOffice: async (id: string) => {
        return apiService.delete(`/attendance/offices/${id}`);
    },

    // Attendance Rules (Admin)
    getRulesByOffice: async (officeId: string) => {
        return apiService.get<any>(`/attendance/rules/${officeId}`);
    },
    updateRules: async (data: AttendanceRuleData) => {
        return apiService.put('/attendance/rules', data);
    },
};
