import { apiService } from './api';

export interface ExpenseReport {
    _id: string;
    employee: string;
    title: string;
    company: string;
    status: string;
    PrimaryApprovalReason?: string;
    SecondaryApprovalReason?: string;
    expenseReportExpense: ExpenseReportExpense[];
    // Computed
    totalAmount?: number;
}

export interface ExpenseReportExpense {
    _id: string;
    ExpenseReportId: string;
    ExpenseCategoryId: string;
    Amount: number;
    CategoryName?: string;
}

export interface ExpenseCategory {
    id: string;
    categoryDesc: string;
}

export const expenseService = {
    getAllExpenseReports: async () => {
        return apiService.get<ExpenseReport[]>('/expense/reports'); // Assuming endpoint
    },
    getAllExpenseReportExpenses: async () => {
        return apiService.get<ExpenseReportExpense[]>('/expense/expenses'); // Assuming endpoint
    },
    getAllExpenseCategories: async () => {
        return apiService.get<ExpenseCategory[]>('/expense/categories');
    },
    addExpenseReport: async (data: FormData) => {
        return apiService.post('/expense/create', data, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
};
