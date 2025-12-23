import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    Modal,
    ScrollView,
    Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { theme } from '../../theme';
import { payrollService } from '../../services/payrollService';
import { useAppSelector } from '../../store/hooks';
import { Ionicons } from '@expo/vector-icons';

export const PayslipScreen = () => {
    const { user, isAdminPortal } = useAppSelector((state) => state.auth);
    const [payslips, setPayslips] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Details Modal
    const [showDetails, setShowDetails] = useState(false);
    const [selectedPayslip, setSelectedPayslip] = useState<any>(null);

    useEffect(() => {
        loadPayslips();
    }, [isAdminPortal]);

    const loadPayslips = async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            let res;
            if (isAdminPortal) {
                res = await payrollService.getAllGeneratedPayroll();
            } else {
                res = await payrollService.getGeneratedPayrollByUser(user.id);
            }
            setPayslips(res.data || []);
        } catch (error) {
            console.error('Failed to load payslips', error);
        } finally {
            setLoading(false);
        }
    };

    const handleView = (item: any) => {
        setSelectedPayslip(item);
        setShowDetails(true);
    };

    const renderItem = ({ item }: { item: any }) => {
        // Data Extraction based on Angular: row?.PayrollUser?.user
        const payrollUser = item.PayrollUser || {};
        const employee = payrollUser.user || {};
        const payroll = payrollUser.payroll || {};
        const employeeName = `${employee.firstName || ''} ${employee.lastName || ''}`;
        const period = `${payroll.month || ''}-${payroll.year || ''}`;
        const status = payroll.status || 'Unknown';

        // Show Pay details if available in structure
        // Angular doesn't show amount in list, only in details.

        return (
            <TouchableOpacity style={styles.card} onPress={() => handleView(item)}>
                <View style={styles.row}>
                    <View>
                        <Text style={styles.employeeName}>{employeeName}</Text>
                        <Text style={styles.periodText}>{period}</Text>
                    </View>
                    <View>
                        <Text style={[
                            styles.statusText,
                            { color: status === 'Generate' ? 'green' : 'orange' }
                        ]}>{status}</Text>
                    </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.gray400} />
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{isAdminPortal ? 'All Payslips' : 'My Payslips'}</Text>
                <TouchableOpacity onPress={loadPayslips}>
                    <Ionicons name="refresh" size={24} color={theme.colors.primary} />
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
            ) : (
                <FlatList
                    data={payslips}
                    renderItem={renderItem}
                    keyExtractor={(item, index) => index.toString()}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.emptyText}>No payslips found.</Text>}
                />
            )}

            <Modal
                visible={showDetails}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowDetails(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Payslip Details</Text>
                        <TouchableOpacity onPress={() => setShowDetails(false)}>
                            <Ionicons name="close" size={24} color="black" />
                        </TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={styles.detailsContent}>
                        {selectedPayslip && (
                            <View>
                                <Text style={styles.detailLabel}>Employee</Text>
                                <Text style={styles.detailValue}>
                                    {selectedPayslip.PayrollUser?.user?.firstName} {selectedPayslip.PayrollUser?.user?.lastName}
                                </Text>

                                <Text style={styles.detailLabel}>Period</Text>
                                <Text style={styles.detailValue}>
                                    {selectedPayslip.PayrollUser?.payroll?.month}-{selectedPayslip.PayrollUser?.payroll?.year}
                                </Text>

                                <Text style={styles.detailLabel}>Status</Text>
                                <Text style={styles.detailValue}>{selectedPayslip.PayrollUser?.payroll?.status}</Text>

                                <View style={styles.divider} />

                                <Text style={styles.sectionHeader}>Summary</Text>
                                {/* Add specific salary details if structure allows. 
                                     Angular uses a complex view-payslip component.
                                     For now, showing basic info available in list object. 
                                     Assuming selectedPayslip contains generated payroll details.
                                 */}
                                <Text style={{ fontStyle: 'italic', color: 'gray' }}>
                                    Detailed breakdown requires full object inspection.
                                    (Placeholder for detailed earnings/deductions)
                                </Text>
                            </View>
                        )}
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray200,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    loader: {
        marginTop: 20,
    },
    list: {
        padding: 16,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flex: 1,
        marginRight: 10,
        alignItems: 'center',
    },
    employeeName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    periodText: {
        fontSize: 14,
        color: theme.colors.gray600,
        marginTop: 4,
    },
    statusText: {
        fontWeight: 'bold',
        fontSize: 14,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 20,
        color: theme.colors.gray500,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    detailsContent: {
        padding: 16,
    },
    detailLabel: {
        fontSize: 14,
        color: theme.colors.gray600,
        marginTop: 12,
    },
    detailValue: {
        fontSize: 16,
        fontWeight: '500',
        color: theme.colors.text,
        marginTop: 4,
    },
    divider: {
        height: 1,
        backgroundColor: theme.colors.gray300,
        marginVertical: 20,
    },
    sectionHeader: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
    },
});

export default PayslipScreen;
