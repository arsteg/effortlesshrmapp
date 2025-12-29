import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const QUEUE_KEY = '@attendance_sync_queue';

export interface AttendanceRecord {
    id: string;
    type: 'check_in' | 'check_out';
    timestamp: string;
    latitude: number;
    longitude: number;
    photoUri?: string;
}

export const syncService = {
    /**
     * Adds a record to the sync queue
     */
    async queueRecord(record: AttendanceRecord) {
        try {
            const currentQueue = await this.getQueue();
            currentQueue.push(record);
            await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(currentQueue));

            const isConnected = (await NetInfo.fetch()).isConnected;
            if (isConnected) {
                await this.processQueue();
            }
        } catch (error) {
            console.error('Failed to queue record:', error);
        }
    },

    /**
     * Retrieves the current sync queue
     */
    async getQueue(): Promise<AttendanceRecord[]> {
        const queueJson = await AsyncStorage.getItem(QUEUE_KEY);
        return queueJson ? JSON.parse(queueJson) : [];
    },

    /**
     * Processes the sync queue by sending records to the API
     */
    async processQueue() {
        const queue = await this.getQueue();
        if (queue.length === 0) return;

        console.log(`Processing ${queue.length} records...`);

        // Iterate through queue and attempt to send each record
        const remainingQueue = [];
        for (const record of queue) {
            try {
                const success = await this.sendRecordToApi(record);
                if (!success) {
                    remainingQueue.push(record);
                }
            } catch (error) {
                remainingQueue.push(record);
            }
        }

        await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remainingQueue));
    },

    /**
     * Mock API call to send record
     */
    async sendRecordToApi(record: AttendanceRecord): Promise<boolean> {
        // In a real app, use axios to post to /attendance/check-in
        console.log('Syncing record to API:', record.id);
        return true; // Assume success for mock
    }
};
