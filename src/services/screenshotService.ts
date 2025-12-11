import { apiService } from './api';

export interface Screenshot {
    id: string;
    url: string;
    thumbnailUrl?: string;
    timestamp: string;
    userId: string;
    userName?: string;
    application?: string;
    activityLevel?: number;
}

export const screenshotService = {
    async getScreenshots(
        userId: string,
        startDate: string,
        endDate: string
    ): Promise<Screenshot[]> {
        return await apiService.get<Screenshot[]>(
            `/api/screenshots?userId=${userId}&startDate=${startDate}&endDate=${endDate}`
        );
    },

    async getScreenshot(screenshotId: string): Promise<Screenshot> {
        return await apiService.get<Screenshot>(`/api/screenshots/${screenshotId}`);
    },

    async deleteScreenshot(screenshotId: string): Promise<void> {
        return await apiService.delete(`/api/screenshots/${screenshotId}`);
    },

    async getScreenshotsByApplication(
        userId: string,
        application: string,
        startDate: string,
        endDate: string
    ): Promise<Screenshot[]> {
        return await apiService.get<Screenshot[]>(
            `/api/screenshots/by-application?userId=${userId}&application=${application}&startDate=${startDate}&endDate=${endDate}`
        );
    },
};
