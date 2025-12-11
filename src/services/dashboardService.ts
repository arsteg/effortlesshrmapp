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
} from '../types';

export const dashboardService = {
    async getHoursWorked(userId: string, date: string): Promise<HoursWorkedData> {
        return await apiService.get<HoursWorkedData>(
            `${HOURS_WORKED}?userId=${userId}&date=${date}`
        );
    },

    async getWeeklySummary(userId: string, date: string): Promise<WeeklySummaryData> {
        return await apiService.get<WeeklySummaryData>(
            `${WEEKLY_SUMMARY}?userId=${userId}&date=${date}`
        );
    },

    async getMonthlySummary(userId: string, date: string): Promise<MonthlySummaryData> {
        return await apiService.get<MonthlySummaryData>(
            `${MONTHLY_SUMMARY}?userId=${userId}&date=${date}`
        );
    },

    async getTaskWiseHours(userId: string): Promise<TaskWiseHoursData[]> {
        return await apiService.get<TaskWiseHoursData[]>(
            `${TASK_WISE_HOURS}?userId=${userId}`
        );
    },

    async getApplicationTimeSummary(
        userId: string,
        date: string
    ): Promise<ApplicationTimeSummary[]> {
        return await apiService.get<ApplicationTimeSummary[]>(
            `${GET_APPLICATION_TIME_SUMMARY}?userId=${userId}&date=${date}`
        );
    },

    async getTaskStatusCounts(userId: string): Promise<TaskStatusCount[]> {
        return await apiService.get<TaskStatusCount[]>(
            `${GET_TASK_STATUS_COUNTS}?userId=${userId}`
        );
    },

    async getLastInvoice(): Promise<PaymentInfo> {
        return await apiService.get<PaymentInfo>(GET_LAST_INVOICE);
    },

    async getUpcomingPayment(): Promise<PaymentInfo> {
        return await apiService.get<PaymentInfo>(GET_UPCOMING_PAYMENT);
    },

    async getTeamMembers(userId: string): Promise<User[]> {
        try {
            console.log('getTeamMembers: Starting for userId:', userId);

            // Get subordinates IDs
            const subordinateIds = await apiService.get<string[]>(
                `${GET_SUBORDINATES}?userId=${userId}`
            );

            console.log('getTeamMembers: Subordinate IDs:', subordinateIds);

            if (subordinateIds && subordinateIds.length > 0) {
                // Get user details for subordinates
                const users = await apiService.post<User[]>(GET_USERS, {
                    userId: subordinateIds
                });

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
        return await apiService.get<DayWorkStatusProject[]>(
            `${DAY_WORK_STATUS_BY_USER}?userId=${userId}&date=${date}`
        );
    },
};
