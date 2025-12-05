import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
    Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { theme } from '../../theme';
import { payrollService } from '../../services/payrollService'; // You need to implement this
import { useAppSelector } from '../../store/hooks';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export const PayslipScreen = () => {
    const { user } = useAppSelector((state) => state.auth);
    const [payslips, setPayslips] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState<string | null>(null);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    useEffect(() => {
        loadPayslips();
    }, [selectedYear]);

    const loadPayslips = async () => {
        setLoading(true);
        try {
            // Adjust payload as per actual API requirements found in Angular app
            const data = await payrollService.getPayslips(selectedYear);
            // Filter for current user if API returns all (unlikely for user endpoint but safe to check)
            // const userPayslips = data.filter(p => p.employeeId === user?.id); 
            setPayslips(data || []);
        } catch (error) {
            console.error('Failed to load payslips', error);
            // Alert.alert('Error', 'Failed to load payslips');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (item: any) => {
        setDownloading(item.id);
        try {
            // const pdfUrl = item.pdfUrl; // If available directly
            // For now, simulating download or using a service method that returns a URL/Blob
            // In a real scenario, you might need to use FileSystem.downloadAsync if you have a direct URL

            // Example if you have a direct URL:
            // const fileUri = FileSystem.documentDirectory + `payslip_${item.month}_${item.year}.pdf`;
            // const { uri } = await FileSystem.downloadAsync(pdfUrl, fileUri);

            // Mocking for now as we don't have the exact download mechanism fully confirmed
            Alert.alert('Info', 'Download functionality requires exact API endpoint details. Implemented as placeholder.');

            // If you had the file locally:
            // await Sharing.shareAsync(uri);

        } catch (error) {
            console.error('Download failed', error);
            Alert.alert('Error', 'Failed to download payslip');
        } finally {
            setDownloading(null);
        }
    };

    const getMonthName = (monthNumber: number) => {
        const date = new Date();
        date.setMonth(monthNumber - 1);
        return date.toLocaleString('default', { month: 'long' });
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.monthText}>{getMonthName(item.month)} {item.year}</Text>
                    {item.netPay && <Text style={styles.amountText}>Net Pay: ${item.netPay}</Text>}
                </View>
                <TouchableOpacity
                    style={styles.downloadButton}
                    onPress={() => handleDownload(item)}
                    disabled={!!downloading}
                >
                    {downloading === item.id ? (
                        <ActivityIndicator color={theme.colors.primary} size="small" />
                    ) : (
                        <Ionicons name="download-outline" size={24} color={theme.colors.primary} />
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar style="light" backgroundColor={theme.colors.primary} />
            <View style={styles.filterContainer}>
                <Text style={styles.headerTitle}>Payslips</Text>
                {/* Year Selector could go here */}
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
            ) : (
                <FlatList
                    data={payslips}
                    renderItem={renderItem}
                    keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.emptyText}>No payslips found for this year.</Text>}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.backgroundSecondary,
    },
    filterContainer: {
        padding: theme.spacing.md,
        backgroundColor: theme.colors.white,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray200,
    },
    headerTitle: {
        fontSize: theme.typography.fontSize.xl,
        fontWeight: 'bold',
        color: theme.colors.textPrimary,
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    list: {
        padding: theme.spacing.md,
    },
    card: {
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
        ...theme.shadows.small,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    header: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    monthText: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: 'bold',
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing.xs,
    },
    amountText: {
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.success,
        fontWeight: 'bold',
    },
    downloadButton: {
        padding: theme.spacing.sm,
        borderRadius: theme.borderRadius.round,
        backgroundColor: theme.colors.background,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: theme.spacing.xl,
        color: theme.colors.textSecondary,
        fontSize: theme.typography.fontSize.md,
    },
});
