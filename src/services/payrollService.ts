import { apiService } from './api';
import { ApiResponse } from '../types';

export interface Payslip {
    id: string; // or number depending on backend
    month: number;
    year: number;
    companyId?: string;
    employeeId?: string;
    // Add other relevant fields if known, or use 'any' for now if structure is complex
    generatedDate?: string;
    netPay?: number;
    pdfUrl?: string; // If API returns a URL directly
}

export const payrollService = {
    getAllGeneratedPayroll: async () => {
        return apiService.post<ApiResponse<any>>('payroll/generatedPayroll-by-company', {});
    },

    getGeneratedPayrollByUser: async (userId: string) => {
        return apiService.get<ApiResponse<any>>(`payroll/generatedPayroll-by-userId/${userId}`);
    }
};
