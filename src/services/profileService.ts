import { apiService } from './api';
import { User } from '../types';

export const profileService = {
    async updateProfile(userId: string, data: Partial<User>): Promise<User> {
        return await apiService.put<User>(`/api/users/${userId}`, data);
    },

    async uploadProfilePicture(userId: string, imageUri: string): Promise<{ url: string }> {
        const formData = new FormData();

        // Extract filename from URI
        const filename = imageUri.split('/').pop() || 'profile.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('file', {
            uri: imageUri,
            name: filename,
            type,
        } as any);

        return await apiService.post<{ url: string }>(
            `/api/users/${userId}/profile-picture`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
    },

    async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
        return await apiService.post<void>('/api/auth/change-password', {
            userId,
            currentPassword,
            newPassword,
        });
    },

    async updateNotificationPreferences(userId: string, preferences: {
        emailNotifications?: boolean;
        pushNotifications?: boolean;
    }): Promise<void> {
        return await apiService.put<void>(`/api/users/${userId}/notification-preferences`, preferences);
    },

    async getProfile(userId: string): Promise<User> {
        return await apiService.get<User>(`/api/users/${userId}`);
    },
};
