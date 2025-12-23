import { apiService } from './api';
import { ApiResponse } from '../types';

export const projectService = {
    getProjects: async (skip: string = '', next: string = '') => {
        return apiService.post<ApiResponse<any>>('project/projectlist', { skip, next });
    }
};
