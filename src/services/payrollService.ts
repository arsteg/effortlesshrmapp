import { apiService } from './api';

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
    getPayslips: async (year: number) => {
        return apiService.post<any[]>('/payroll/payroll-by-company', { year });
    },
    // Add other methods if needed, e.g., to download a specific payslip
    downloadPayslip: async (id: string, month: number, year: number) => {
        // This might return a file blob or a URL depending on the API. 
        // For now, assuming it returns a file or we construct a URL.
        return apiService.get<any>(`/payroll/download/${id}?month=${month}&year=${year}`, { responseType: 'blob' });
    }
};
