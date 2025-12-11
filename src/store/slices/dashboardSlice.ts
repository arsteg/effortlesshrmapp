import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { dashboardService } from '../../services/dashboardService';
import {
    HoursWorkedData,
    WeeklySummaryData,
    MonthlySummaryData,
    ApplicationTimeSummary,
    TaskStatusCount,
    ProjectWiseTask,
    TaskWiseHoursData,
    PaymentInfo,
    User,
} from '../../types';

interface DashboardState {
    hoursWorked: HoursWorkedData | null;
    weeklySummary: WeeklySummaryData | null;
    monthlySummary: MonthlySummaryData | null;
    applicationTimeSummary: ApplicationTimeSummary[];
    taskStatusCounts: TaskStatusCount[];
    projectWiseTasks: ProjectWiseTask[];
    paymentInfo: PaymentInfo | null;
    teamMembers: User[];
    selectedProductivityUserId: string | null;
    selectedTaskUserId: string | null;
    selectedProjectUserId: string | null;
    selectedDate: string;
    isLoading: boolean;
    error: string | null;
}

const initialState: DashboardState = {
    hoursWorked: null,
    weeklySummary: null,
    monthlySummary: null,
    applicationTimeSummary: [],
    taskStatusCounts: [],
    projectWiseTasks: [],
    paymentInfo: null,
    teamMembers: [],
    selectedProductivityUserId: null,
    selectedTaskUserId: null,
    selectedProjectUserId: null,
    selectedDate: new Date().toISOString(),
    isLoading: false,
    error: null,
};

export const fetchDashboardData = createAsyncThunk(
    'dashboard/fetchData',
    async ({ userId, date }: { userId: string; date: string }, { rejectWithValue }) => {
        try {
            const [
                hoursWorked,
                weeklySummary,
                monthlySummary,
                applicationTimeSummary,
                taskStatusCounts,
                taskWiseHours,
            ] = await Promise.all([
                dashboardService.getHoursWorked(userId, date),
                dashboardService.getWeeklySummary(userId, date),
                dashboardService.getMonthlySummary(userId, date),
                dashboardService.getApplicationTimeSummary(userId, date),
                dashboardService.getTaskStatusCounts(userId),
                dashboardService.getTaskWiseHours(userId),
            ]);

            // Transform task wise hours to project wise tasks
            const projectWiseTasks: ProjectWiseTask[] = [];
            taskWiseHours.forEach((project) => {
                project.tasks.forEach((task) => {
                    projectWiseTasks.push({
                        name: project.projectName,
                        taskName: task.taskName,
                        timeTaken: formatTime(task.totalTime),
                    });
                });
            });

            return {
                hoursWorked,
                weeklySummary,
                monthlySummary,
                applicationTimeSummary,
                taskStatusCounts,
                projectWiseTasks,
            };
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch dashboard data');
        }
    }
);

export const fetchPaymentInfo = createAsyncThunk(
    'dashboard/fetchPaymentInfo',
    async (_, { rejectWithValue }) => {
        try {
            const [lastInvoice, upcomingPayment] = await Promise.all([
                dashboardService.getLastInvoice(),
                dashboardService.getUpcomingPayment(),
            ]);

            return {
                ...upcomingPayment,
                ...lastInvoice,
            };
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch payment info');
        }
    }
);

export const fetchTeamMembers = createAsyncThunk(
    'dashboard/fetchTeamMembers',
    async (userId: string, { rejectWithValue }) => {
        try {
            return await dashboardService.getTeamMembers(userId);
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch team members');
        }
    }
);

const formatTime = (milliseconds: number): string => {
    const hours = Math.floor(milliseconds / 3600000);
    const minutes = Math.floor((milliseconds % 3600000) / 60000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

const dashboardSlice = createSlice({
    name: 'dashboard',
    initialState,
    reducers: {
        setSelectedDate: (state, action: PayloadAction<string>) => {
            state.selectedDate = action.payload;
        },
        setSelectedProductivityUserId: (state, action: PayloadAction<string>) => {
            state.selectedProductivityUserId = action.payload;
        },
        setSelectedTaskUserId: (state, action: PayloadAction<string>) => {
            state.selectedTaskUserId = action.payload;
        },
        setSelectedProjectUserId: (state, action: PayloadAction<string>) => {
            state.selectedProjectUserId = action.payload;
        },
        clearDashboardData: (state) => {
            state.hoursWorked = null;
            state.weeklySummary = null;
            state.monthlySummary = null;
            state.applicationTimeSummary = [];
            state.taskStatusCounts = [];
            state.projectWiseTasks = [];
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchDashboardData.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchDashboardData.fulfilled, (state, action) => {
                state.isLoading = false;
                state.hoursWorked = action.payload.hoursWorked;
                state.weeklySummary = action.payload.weeklySummary;
                state.monthlySummary = action.payload.monthlySummary;
                state.applicationTimeSummary = action.payload.applicationTimeSummary;
                state.taskStatusCounts = action.payload.taskStatusCounts;
                state.projectWiseTasks = action.payload.projectWiseTasks;
            })
            .addCase(fetchDashboardData.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            .addCase(fetchPaymentInfo.fulfilled, (state, action) => {
                state.paymentInfo = action.payload;
            })
            .addCase(fetchTeamMembers.fulfilled, (state, action) => {
                state.teamMembers = action.payload;
            });
    },
});

export const {
    setSelectedDate,
    setSelectedProductivityUserId,
    setSelectedTaskUserId,
    setSelectedProjectUserId,
    clearDashboardData
} = dashboardSlice.actions;
export default dashboardSlice.reducer;
