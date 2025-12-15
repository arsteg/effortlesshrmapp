import { apiService } from './api';

export interface TimeLog {
    _id: string;
    userId: string;
    startTime: string;
    endTime: string;
    filePath?: string;
    fileString?: string;
    url?: string;
    clicks?: number;
    keysPressed?: number;
    scrolls?: number;
    allKeysPressed?: string;
    isManualTime?: boolean;
    activityLevel?: number;
}

export interface Screenshot {
    id: string;
    url: string;
    thumbnailUrl?: string;
    timestamp: string;
    userId: string;
    userName?: string;
    application?: string;
    activityLevel?: number;
    clicks?: number;
    keysPressed?: number;
    scrolls?: number;
    isManualTime?: boolean;
}

export interface WeeklyTimeData {
    totalHours: number;
    totalMinutes: number;
}

export const screenshotService = {
    async getLogsWithImages(
        userId: string,
        date: string
    ): Promise<TimeLog[]> {
        const response = await apiService.get<{ data: TimeLog[] }>(
            `timeLogs/getLogsWithImages?userId=${userId}&date=${date}`
        );
        return response.data || [];
    },

    async getCurrentWeekTotalTime(
        userId: string,
        startDate: string,
        endDate: string
    ): Promise<TimeLog[]> {
        const response = await apiService.get<{ data: TimeLog[] }>(
            `timeLogs/getCurrentWeekTotalTime?userId=${userId}&startDate=${startDate}&endDate=${endDate}`
        );
        return response.data || [];
    },

    async deleteScreenshot(screenshotId: string): Promise<void> {
        return await apiService.delete(`timeLogs/${screenshotId}`);
    },

    // Get subordinates for admin users
    async getSubordinates(userId: string): Promise<any> {
        return await apiService.get(`auth/roles/getSubordinates?userId=${userId}`);
    },

    // Get users by IDs
    async getUsers(userIds: string[]): Promise<any> {
        return await apiService.post('users/getUsers', { userIds });
    },

    // Helper function to format date for API
    formatDateForAPI(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}T00:00:00.000+00:00`;
    },

    // Helper function to get Monday of current week
    getMonday(date: Date): Date {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    },

    // Helper function to calculate total time from logs
    calculateTotalTime(logs: TimeLog[]): { hours: number; minutes: number } {
        const totalMinutes = logs.length * 10; // Each log represents 10 minutes
        return {
            hours: Math.floor(totalMinutes / 60),
            minutes: totalMinutes % 60
        };
    }
};
