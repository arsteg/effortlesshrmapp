import { apiService } from './api';
import { GET_LOGIN_USERS, SET_LIVE_TRACKING, REMOVE_LIVE_TRACKING } from '../utils/constants';
import { ApiResponse } from '../types';

export interface RealTimeData {
    onlineUsers: Array<{
        user: {
            _id: string;
            firstName: string;
            lastName: string;
            id: string;
        };
        project: string;
        task: string;
        isOnline?: boolean;
    }>;
    totalMember: number;
    activeMember: number;
    totalNonProductiveMember: number;
}

class TimeLogService {
    async getRealTimeUsers(users: string[] = [], projects: string[] = [], tasks: string[] = []): Promise<RealTimeData[]> {
        const payload = {
           
        };
        const response = await apiService.post<ApiResponse<RealTimeData[]>>(GET_LOGIN_USERS, payload);
        return response.data;
    }

    async createLiveScreenRecord(userIds: string[]): Promise<any> {
        return apiService.post(SET_LIVE_TRACKING, { users: userIds });
    }

    async removeLiveScreenRecord(userIds: string[]): Promise<any> {
        return apiService.post(REMOVE_LIVE_TRACKING, { users: userIds });
    }
}

export const timeLogService = new TimeLogService();
