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
import { User } from '../../types';

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
        if (!user?.id) {
            console.log('No user ID available');
            return;
        }
        setLoading(true);
        try {
            let res;
            console.log('Loading payslips for:', isAdminPortal ? 'Admin' : 'User', user.id);

            if (isAdminPortal) {
                 const companyId = user.company?.id || (user as any).companyId;
                res = await payrollService.getAllGeneratedPayroll(companyId);
            } else {
                res = await payrollService.getGeneratedPayrollByUser(user.id);
            }

            console.log('Payslip API Response:', res);
            const data = res.data || [];
            console.log('Payslip data count:', data.length);

            setPayslips(data);
        } catch (error: any) {
            console.error('Failed to load payslips:', error);
            console.error('Error details:', error.message);
            Alert.alert('Error', 'Failed to load payslips. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleView = (item: any) => {
        setSelectedPayslip(item);
        setShowDetails(true);
    };

    const renderItem = ({ item }: { item: any }) => {
        const payrollUser = item.PayrollUser || {};
        const employee = payrollUser.user || {};
        const payroll = payrollUser.payroll || {};
        const employeeName = `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'Unknown';
        const period = `${payroll.month || ''}-${payroll.year || ''}`;
        const status = payroll.status || 'Unknown';
        const generatedDate = payroll.date ? new Date(payroll.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }) : 'N/A';

        return (
            <TouchableOpacity style={styles.card} onPress={() => handleView(item)}>
                <View style={styles.cardContent}>
                    <View style={styles.cardLeft}>
                        <Text style={styles.employeeName}>{employeeName}</Text>
                        <Text style={styles.periodText}>{period}</Text>
                        <Text style={styles.generatedText}>Generated: {generatedDate}</Text>
                    </View>
                    <View style={styles.cardRight}>
                        <Text style={[
                            styles.statusText,
                            { color: status === 'Generate' ? theme.colors.success : theme.colors.warning }
                        ]}>{status}</Text>
                        <Ionicons name="chevron-forward" size={20} color={theme.colors.gray400} style={{ marginTop: 4 }} />
                    </View>
                </View>
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

                                <Text style={styles.detailLabel}>Generated On</Text>
                                <Text style={styles.detailValue}>
                                    {selectedPayslip.PayrollUser?.payroll?.date
                                        ? new Date(selectedPayslip.PayrollUser.payroll.date).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })
                                        : 'N/A'}
                                </Text>

                                <Text style={styles.detailLabel}>Status</Text>
                                <Text style={styles.detailValue}>{selectedPayslip.PayrollUser?.payroll?.status}</Text>

                                <View style={styles.divider} />

                                <Text style={styles.sectionHeader}>Payslip Information</Text>
                                <Text style={styles.infoText}>
                                    Complete payslip details are available in the web application.
                                    This view shows basic payslip information.
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
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    cardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardLeft: {
        flex: 1,
    },
    cardRight: {
        alignItems: 'flex-end',
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
    generatedText: {
        fontSize: 12,
        color: theme.colors.gray500,
        marginTop: 2,
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
    infoText: {
        fontSize: 14,
        color: theme.colors.gray600,
        fontStyle: 'italic',
        lineHeight: 20,
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
