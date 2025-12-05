import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { expenseService, ExpenseReport } from '../../services/expenseService';
import { theme } from '../../theme';
import { Ionicons } from '@expo/vector-icons';

export const ExpenseScreen = ({ navigation }: any) => {
    const [expenses, setExpenses] = useState<ExpenseReport[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadExpenses();
    }, []);

    const loadExpenses = async () => {
        setLoading(true);
        try {
            const reports = await expenseService.getAllExpenseReports();
            // In a real app, we would also fetch expenses and categories to calculate totals and show names
            // For now, we'll just show the reports
            setExpenses(reports || []);
        } catch (error) {
            console.error('Failed to load expenses', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'approved': return theme.colors.success;
            case 'rejected': return theme.colors.error;
            case 'pending': return theme.colors.warning;
            default: return theme.colors.textSecondary;
        }
    };

    const renderItem = ({ item }: { item: ExpenseReport }) => (
        <TouchableOpacity style={styles.card}>
            <View style={styles.header}>
                <Text style={styles.title}>{item.title}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                </View>
            </View>
            <View style={styles.footer}>
                <Text style={styles.idText}>ID: {item._id.substring(0, 8)}...</Text>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.gray400} />
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {loading ? (
                <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
            ) : (
                <FlatList
                    data={expenses}
                    renderItem={renderItem}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.emptyText}>No expense reports found.</Text>}
                />

            )}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('AddExpense')}
            >
                <Ionicons name="add" size={30} color={theme.colors.white} />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.backgroundSecondary,
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
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    title: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: 'bold',
        color: theme.colors.textPrimary,
        flex: 1,
    },
    statusBadge: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.borderRadius.round,
        marginLeft: theme.spacing.sm,
    },
    statusText: {
        fontSize: theme.typography.fontSize.xs,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    idText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.textSecondary,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: theme.spacing.xl,
        color: theme.colors.textSecondary,
    },
    fab: {
        position: 'absolute',
        bottom: theme.spacing.xl,
        right: theme.spacing.xl,
        backgroundColor: theme.colors.primary,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        ...theme.shadows.medium,
        elevation: 5,
    },
});
