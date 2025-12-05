import { apiService } from './api';

export interface TaskItem {
    id: string;
    taskName: string;
    description: string;
    status: string;
    priority: string;
    dueDate: string;
    // Add other fields as needed based on API response
}

export interface TaskRequest {
    pageNumber: number;
    pageSize: number;
    // Add filtering fields if needed
}

export const taskService = {
    getTasks: async (req: TaskRequest) => {
        return apiService.post<TaskItem[]>('/tasks/get', req); // Assuming endpoint
    },
};
