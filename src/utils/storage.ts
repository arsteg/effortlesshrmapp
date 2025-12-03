import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// AsyncStorage wrapper for non-sensitive data
export const storage = {
    async setItem(key: string, value: string): Promise<void> {
        try {
            await AsyncStorage.setItem(key, value);
        } catch (error) {
            console.error('Error saving to AsyncStorage:', error);
            throw error;
        }
    },

    async getItem(key: string): Promise<string | null> {
        try {
            return await AsyncStorage.getItem(key);
        } catch (error) {
            console.error('Error reading from AsyncStorage:', error);
            return null;
        }
    },

    async removeItem(key: string): Promise<void> {
        try {
            await AsyncStorage.removeItem(key);
        } catch (error) {
            console.error('Error removing from AsyncStorage:', error);
            throw error;
        }
    },

    async clear(): Promise<void> {
        try {
            await AsyncStorage.clear();
        } catch (error) {
            console.error('Error clearing AsyncStorage:', error);
            throw error;
        }
    },
};

// SecureStore wrapper for sensitive data (tokens, passwords)
export const secureStorage = {
    async setItem(key: string, value: string): Promise<void> {
        try {
            await SecureStore.setItemAsync(key, value);
        } catch (error) {
            console.error('Error saving to SecureStore:', error);
            throw error;
        }
    },

    async getItem(key: string): Promise<string | null> {
        try {
            return await SecureStore.getItemAsync(key);
        } catch (error) {
            console.error('Error reading from SecureStore:', error);
            return null;
        }
    },

    async removeItem(key: string): Promise<void> {
        try {
            await SecureStore.deleteItemAsync(key);
        } catch (error) {
            console.error('Error removing from SecureStore:', error);
            throw error;
        }
    },
};

// Helper functions
export const saveUserData = async (data: any) => {
    await storage.setItem('UserInfo', JSON.stringify(data));
};

export const getUserData = async () => {
    const data = await storage.getItem('UserInfo');
    return data ? JSON.parse(data) : null;
};

export const saveToken = async (token: string) => {
    await secureStorage.setItem('AuthorizeToken', token);
};

export const getToken = async () => {
    return await secureStorage.getItem('AuthorizeToken');
};

export const clearAuthData = async () => {
    await storage.removeItem('UserInfo');
    await secureStorage.removeItem('AuthorizeToken');
    await storage.removeItem('Email');
    await secureStorage.removeItem('Password');
    await storage.removeItem('IsRemember');
};
