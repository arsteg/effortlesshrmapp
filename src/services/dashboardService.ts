import { apiService } from './api';
import {
    HOURS_WORKED,
    WEEKLY_SUMMARY,
    MONTHLY_SUMMARY,
    TASK_WISE_HOURS,
    GET_APPLICATION_TIME_SUMMARY,
    GET_TASK_STATUS_COUNTS,
    GET_LAST_INVOICE,
    GET_UPCOMING_PAYMENT,
    GET_SUBORDINATES,
    GET_USERS,
    DAY_WORK_STATUS_BY_USER,
} from '../utils/constants';
import {
    HoursWorkedData,
    WeeklySummaryData,
    MonthlySummaryData,
    TaskWiseHoursData,
    ApplicationTimeSummary,
    TaskStatusCount,
    PaymentInfo,
    User,
    DayWorkStatusProject,
    ApiResponse,
} from '../types';

export const dashboardService = {
    async getHoursWorked(userId: string, date: string): Promise<HoursWorkedData> {
        const response = await apiService.get<ApiResponse<HoursWorkedData>>(
            `${HOURS_WORKED}?userId=${userId}&date=${date}`
        );
        console.log('getHoursWorked API Response Data:', JSON.stringify(response.data, null, 2));
        return response.data;
    },

    async getWeeklySummary(userId: string, date: string): Promise<WeeklySummaryData> {
        const response = await apiService.get<ApiResponse<WeeklySummaryData>>(
            `${WEEKLY_SUMMARY}?userId=${userId}&date=${date}`
        );
        return response.data;
    },

    async getMonthlySummary(userId: string, date: string): Promise<MonthlySummaryData> {
        const response = await apiService.get<ApiResponse<MonthlySummaryData>>(
            `${MONTHLY_SUMMARY}?userId=${userId}&date=${date}`
        );
        return response.data;
    },

    async getTaskWiseHours(userId: string): Promise<TaskWiseHoursData[]> {
        const response = await apiService.get<ApiResponse<TaskWiseHoursData[]>>(
            `${TASK_WISE_HOURS}?userId=${userId}`
        );
        return response.data;
    },

    async getApplicationTimeSummary(
        userId: string,
        date: string
    ): Promise<ApplicationTimeSummary[]> {
        const response = await apiService.get<ApiResponse<ApplicationTimeSummary[]>>(
            `${GET_APPLICATION_TIME_SUMMARY}?userId=${userId}&date=${date}`
        );
        return response.data;
    },

    async getTaskStatusCounts(userId: string): Promise<TaskStatusCount[]> {
        const response = await apiService.get<ApiResponse<TaskStatusCount[]>>(
            `${GET_TASK_STATUS_COUNTS}?userId=${userId}`
        );
        return response.data;
    },

    async getLastInvoice(): Promise<PaymentInfo> {
        const response = await apiService.get<ApiResponse<PaymentInfo>>(GET_LAST_INVOICE);
        return response.data;
    },

    async getUpcomingPayment(): Promise<PaymentInfo> {
        const response = await apiService.get<ApiResponse<PaymentInfo>>(GET_UPCOMING_PAYMENT);
        return response.data;
    },

    async getTeamMembers(userId: string): Promise<User[]> {
        try {
            console.log('getTeamMembers: Starting for userId:', userId);

            // Get subordinates IDs
            const response = await apiService.get<any>(
                `${GET_SUBORDINATES}/${userId}`
            );

            console.log('getTeamMembers: Subordinate IDs:', response);

            if (response && response.data && response.data.length > 0) {
                // Get user details for subordinates
                // const users = await apiService.post<User[]>(GET_USERS, {
                //     userId: subordinateIds
                // });

                const users = response.data as User[];
                console.log('getTeamMembers: Users fetched:', users);

                if (users && users.length > 0) {
                    // Add current user as "Me" at the beginning
                    const result = [
                        { id: userId, firstName: 'Me', lastName: '', FullName: 'Me', email: '' },
                        ...users
                    ];
                    console.log('getTeamMembers: Returning with subordinates:', result);
                    return result;
                }
            }

            // If no subordinates, return only current user
            console.log('getTeamMembers: No subordinates, returning only Me');
            return [{ id: userId, firstName: 'Me', lastName: '', FullName: 'Me', email: '' }];
        } catch (error) {
            console.error('getTeamMembers: ERROR -', error);
            // Return current user on error
            return [{ id: userId, firstName: 'Me', lastName: '', FullName: 'Me', email: '' }];
        }
    },

    async getDayWorkStatusByUser(userId: string, date: string): Promise<DayWorkStatusProject[]> {
        const response = await apiService.get<ApiResponse<DayWorkStatusProject[]>>(
            `${DAY_WORK_STATUS_BY_USER}?userId=${userId}&date=${date}`
        );
        return response.data;
    },
};
