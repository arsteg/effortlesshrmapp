import { apiService } from './api';
import { ApiResponse, Task, Project, User } from '../types';
import * as CONSTANTS from '../utils/constants';

export interface TaskListRequest {
    userId?: string;
    skip: number;
    next: number;
}

export interface TaskListData {
    taskList: any[];
    taskCount: number;
}

export interface AddTaskRequest {
    taskName: string;
    startDate: string;
    endDate: string;
    startTime?: string;
    description: string;
    comment?: string;
    priority: string;
    project: string;
    status: string;
    user?: string; // Assignee
}

export const taskService = {
    getTasksByUser: async (req: TaskListRequest) => {
        return apiService.post<ApiResponse<TaskListData>>(CONSTANTS.TASK_LIST_BY_USER, req);
    },

    getTasksByTeam: async (req: { skip: number, next: number }) => {
        return apiService.post<ApiResponse<TaskListData>>(CONSTANTS.TASKLIST_BY_TEAM, req);
    },

    addTask: async (task: AddTaskRequest) => {
        return apiService.post<ApiResponse<any>>(CONSTANTS.CREATE_NEW_TASK, task);
    },

    updateTask: async (id: string, task: Partial<AddTaskRequest>) => {
        return apiService.put<ApiResponse<any>>(`task/update/${id}`, task);
    },

    deleteTask: async (id: string) => {
        return apiService.delete<ApiResponse<any>>(`task/${id}`);
    },

    getProjects: async () => {
        return apiService.post<ApiResponse<any>>(CONSTANTS.PROJECT_LIST, { skip: 0, next: 100 });
    },

    getProjectsByUser: async (userId: string) => {
        return apiService.post<ApiResponse<any>>(CONSTANTS.PROJECT_LIST_BY_USER, { userId, skip: 0, next: 100 });
    },

    getSubordinates: async (managerId: string) => {
        return apiService.get<ApiResponse<any>>(`${CONSTANTS.GET_SUBORDINATES}/${managerId}`);
    },
    projectListByUser: async (userId: string) => {
        return apiService.get<ApiResponse<any>>(`${CONSTANTS.PROJECT_LIST_BY_USER}/${userId}`);
    },

    getUserTaskListByProject: async (userId: string, projectId: string, skip: string = '', next: string = '') => {
        return apiService.post<ApiResponse<any>>('task/getUserTaskListByProject', { userId, projectId, skip, next });
    }
};
