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
} from '../utils/constants';
import {
    HoursWorkedData,
    WeeklySummaryData,
    MonthlySummaryData,
    TaskWiseHoursData,
    ApplicationTimeSummary,
    TaskStatusCount,
    PaymentInfo,
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
};
