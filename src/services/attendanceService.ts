import { apiService } from './api';
import { storage } from '../utils/storage';
import { STORAGE_CACHED_OFFICES } from '../utils/constants';

// A single bad moment on the network or server shouldn't blank out the
// office picker. Retry a couple of times before giving up.
const OFFICE_FETCH_ATTEMPTS = 3;
const OFFICE_FETCH_RETRY_DELAY_MS = 1500;
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

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
    /**
     * Fetches offices, retrying a few times on a failed/non-success
     * response before giving up. On success, the result is also cached to
     * local storage so getCachedOffices() has something to fall back to
     * the next time a fetch fails outright. Returns null if every attempt
     * failed; callers should fall back to getCachedOffices() in that case.
     */
    getOfficesWithRetry: async (params?: { company?: string }): Promise<any[] | null> => {
        let lastError: any;
        for (let attempt = 1; attempt <= OFFICE_FETCH_ATTEMPTS; attempt++) {
            try {
                const res: any = await attendanceService.getOffices(params || {});
                if (res.status?.toLowerCase() === 'success') {
                    const offices = res.data?.offices || [];
                    try {
                        await storage.setItem(STORAGE_CACHED_OFFICES, JSON.stringify(offices));
                    } catch (cacheError) {
                        console.error('Failed to cache offices:', cacheError);
                    }
                    return offices;
                }
                lastError = new Error(res.message || 'Failed to fetch offices');
            } catch (error) {
                lastError = error;
            }
            if (attempt < OFFICE_FETCH_ATTEMPTS) await sleep(OFFICE_FETCH_RETRY_DELAY_MS);
        }
        console.error('getOfficesWithRetry: all attempts failed:', lastError);
        return null;
    },
    /**
     * The office list from the last successful fetch (this session or a
     * previous one). Returns null if nothing has ever been cached, e.g. a
     * brand-new install whose very first fetch also failed.
     */
    getCachedOffices: async (): Promise<any[] | null> => {
        try {
            const raw = await storage.getItem(STORAGE_CACHED_OFFICES);
            return raw ? JSON.parse(raw) : null;
        } catch (error) {
            console.error('Failed to read cached offices:', error);
            return null;
        }
    },
    clockIn: async (data: { officeId?: string; latitude: number; longitude: number; selfieUrl?: string; deviceId?: string; company?: string }) => {
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

    // Reports
    getAttendanceReport: async (data: { officeId?: string; fromDate?: string; toDate?: string; userId?: string; company?: string }) => {
        return apiService.post<any>('/attendance/reports', data);
    }
};

