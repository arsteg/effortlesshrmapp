// User types
export interface User {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    FullName: string;
    role?: string | { id: string; name: string;[key: string]: any };
    isAdmin?: boolean;
}

// Authentication types
export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    status: string;
    message: string;
    token: string;
    data: {
        user: User;
        role?: any;
    };
}

export interface ForgotPasswordRequest {
    email: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
}

export interface BaseResponse {
    status: string;
    message: string;
}

// Dashboard types
export interface HoursWorkedData {
    today: number;
    previousDay: number;
    PercentageDifference: number;
    IsLessThanPrevious: boolean;
}

export interface WeeklySummaryData {
    currentWeek: number;
    previousWeek: number;
    PercentageDifference: number;
    IsLessThanPrevious: boolean;
}

export interface MonthlySummaryData {
    currentMonth: number;
    previousMonth: number;
    PercentageDifference: number;
    IsLessThanPrevious: boolean;
}

export interface ApplicationTimeSummary {
    name: string;
    value: number;
}

export interface TaskStatusCount {
    name: string;
    value: number;
}

export interface ProjectWiseTask {
    name: string;
    taskName: string;
    timeTaken: string;
}

export interface TaskWiseHoursData {
    projectName: string;
    tasks: Array<{
        taskName: string;
        totalTime: number;
    }>;
}

export interface PaymentInfo {
    due_date?: Date;
    due_amount: number;
    total_due_amount: number;
    new_users_amount: number;
    amount: number;
    payment_method?: string;
}

// Task types
export interface Task {
    id: string;
    name: string;
    description?: string;
    projectId: string;
    projectName?: string;
    status: 'To Do' | 'In Progress' | 'Done' | 'Closed';
    assignedUsers?: User[];
    createdAt?: Date;
    updatedAt?: Date;
}

export interface Project {
    id: string;
    name: string;
    description?: string;
    status?: string;
}

export interface TaskUser {
    id: string;
    taskId: string;
    userId: string;
    user?: User;
}

// Screenshots types
export interface Screenshot {
    id: string;
    userId: string;
    imageUrl: string;
    timestamp: Date;
    userName?: string;
}

export interface LogsWithImagesRequest {
    userId: string;
    startDate: string;
    endDate: string;
    skip: number;
    take: number;
}

export interface LogsWithImagesData {
    id: string;
    userId: string;
    imageUrl: string;
    createdAt: Date;
    activity?: string;
    project?: string;
    task?: string;
}

// Manual Time types
export interface ManualTimeRequest {
    id: string;
    userId: string;
    managerId: string;
    projectId: string;
    taskId: string;
    date: Date;
    fromTime: Date;
    toTime: Date;
    reason: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    userName?: string;
    managerName?: string;
    projectName?: string;
    taskName?: string;
}

export interface AddManualTimeRequest {
    userId: string;
    managerId: string;
    projectId: string;
    taskId: string;
    date: string;
    fromTime: string;
    toTime: string;
    reason: string;
}

// Attendance types
export interface AttendanceData {
    id: string;
    userId: string;
    date: Date;
    checkInTime?: Date;
    checkOutTime?: Date;
    totalHours?: number;
    status?: string;
}

export interface UserLocation {
    latitude: number;
    longitude: number;
    address?: string;
}

export interface CheckInRequest {
    userId: string;
    location?: UserLocation;
    timestamp: Date;
}

export interface CheckOutRequest {
    userId: string;
    location?: UserLocation;
    timestamp: Date;
}

// Expense types
export interface ExpenseCategory {
    id: string;
    name: string;
    description?: string;
}

export interface Expense {
    id: string;
    userId: string;
    categoryId: string;
    amount: number;
    date: Date;
    description?: string;
    receiptUrl?: string;
    status: 'Pending' | 'Approved' | 'Rejected';
}

export interface ExpenseReport {
    id: string;
    userId: string;
    name: string;
    startDate: Date;
    endDate: Date;
    totalAmount: number;
    status: 'Draft' | 'Submitted' | 'Approved' | 'Rejected';
    expenses: Expense[];
}

// Interview types
export interface Candidate {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    position?: string;
    applicationStatus?: string;
    createdAt?: Date;
}

export interface ApplicationStatus {
    id: string;
    name: string;
    order?: number;
}

export interface InterviewDetail {
    id: string;
    candidateId: string;
    interviewDate: Date;
    interviewerIds: string[];
    status: string;
    feedback?: string;
}

// Report types
export interface ActivityLevelData {
    userId: string;
    date: Date;
    activityLevel: number;
    keystrokes?: number;
    mouseClicks?: number;
}

export interface TimelineData {
    userId: string;
    date: Date;
    activities: Array<{
        timestamp: Date;
        activity: string;
        duration: number;
    }>;
}

export interface ProductivityData {
    userId: string;
    date: Date;
    productive: number;
    nonProductive: number;
    neutral: number;
}

export interface BrowserHistoryData {
    userId: string;
    url: string;
    title: string;
    timestamp: Date;
    duration: number;
}

export interface LeaveData {
    id: string;
    userId: string;
    startDate: Date;
    endDate: Date;
    reason: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    type: string;
}

// Pagination
export interface PaginationRequest {
    skip: number;
    take: number;
    userId?: string;
}

// API Response wrapper
export interface ApiResponse<T> {
    status: string;
    message: string;
    data: T;
}
