import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useAppSelector } from '../../store/hooks';
import { leaveService } from '../../services/leaveService';
import { theme, shadows, typography, borderRadius, spacing } from '../../theme';
import { Ionicons } from '@expo/vector-icons';

import LeaveDetailsModal from '../../components/modals/LeaveDetailsModal';

type TabStatus = 'Pending' | 'Approved' | 'Rejected';

const LeaveApplicationScreen = ({ navigation }: any) => {
    const { user } = useAppSelector(state => state.auth);
    const [activeTab, setActiveTab] = useState<TabStatus>('Pending');
    const [leaves, setLeaves] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedLeave, setSelectedLeave] = useState<any>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const fetchLeaves = useCallback(async (isRefresh = false) => {
        if (!user?.id) return;

        if (!isRefresh) setLoading(true);
        try {
            const payload = {
                skip: "0",
                next: "100"
            };

            const response = await leaveService.getLeaveApplicationByUser(user.id, payload);
            let rawData = response?.data || [];

            if (!Array.isArray(rawData)) {
                rawData = [];
            }

            setLeaves(rawData);
        } catch (error) {
            console.error("Failed to fetch leaves", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.id, activeTab]);

    useEffect(() => {
        fetchLeaves();
    }, [fetchLeaves]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchLeaves(true);
    };

    const openDetails = (leave: any) => {
        setSelectedLeave(leave);
        setIsModalVisible(true);
    };

    const renderTab = (tab: TabStatus) => {
        const isActive = activeTab === tab;
        return (
            <TouchableOpacity
                style={[styles.tab, isActive && styles.activeTab]}
                onPress={() => setActiveTab(tab)}
            >
                <Text style={[styles.tabText, isActive && styles.activeTabText]}>{tab}</Text>
            </TouchableOpacity>
        );
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Approved': return theme.colors.success;
            case 'Rejected': return theme.colors.error;
            case 'Pending': return theme.colors.warning;
            default: return theme.colors.gray500;
        }
    };

    const renderItem = ({ item }: { item: any }) => {
        return (
            <TouchableOpacity style={styles.card} onPress={() => openDetails(item)}>
                <View style={styles.cardHeader}>
                    <View style={styles.categoryContainer}>
                        <Ionicons name="calendar-outline" size={18} color={theme.colors.primary} />
                        <Text style={styles.categoryText}>{item.leaveCategory?.label || 'Leave'}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                    </View>
                </View>

                <View style={styles.dateRow}>
                    <View style={styles.dateInfo}>
                        <Text style={styles.dateLabel}>From</Text>
                        <Text style={styles.dateValue}>{formatDate(item.startDate)}</Text>
                    </View>
                    <Ionicons name="arrow-forward" size={16} color={theme.colors.gray400} />
                    <View style={styles.dateInfo}>
                        <Text style={styles.dateLabel}>To</Text>
                        <Text style={styles.dateValue}>{formatDate(item.endDate)}</Text>
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.daysCount}>
                        {item.calculatedLeaveDays} {item.calculatedLeaveDays === 1 ? 'Day' : 'Days'}
                    </Text>
                    <Text style={styles.viewLink}>View Details</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.tabsContainer}>
                {renderTab('Pending')}
                {renderTab('Approved')}
                {renderTab('Rejected')}
            </View>

            {loading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={leaves}
                    renderItem={renderItem}
                    keyExtractor={item => item._id || item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="document-text-outline" size={48} color={theme.colors.gray300} />
                            <Text style={styles.emptyText}>No leave applications found.</Text>
                        </View>
                    }
                />
            )}

            <LeaveDetailsModal
                visible={isModalVisible}
                onClose={() => setIsModalVisible(false)}
                leave={selectedLeave}
                onActionSuccess={onRefresh}
                userRole={typeof user?.role === 'string' ? user.role : (user?.role as any)?.name || ''}
                currentUserId={user?.id?.toString() || ''}
            />

            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('ApplyLeave')}
            >
                <Ionicons name="add" size={28} color={theme.colors.white} />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.backgroundSecondary,
    },
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: theme.colors.white,
        padding: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray200,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: theme.colors.primary,
    },
    tabText: {
        fontSize: typography.fontSize.md,
        color: theme.colors.gray500,
        fontWeight: '500',
    },
    activeTabText: {
        color: theme.colors.primary,
        fontWeight: 'bold',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: spacing.md,
        paddingBottom: spacing.xl,
    },
    card: {
        backgroundColor: theme.colors.white,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        ...shadows.small,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    categoryContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    categoryText: {
        fontSize: typography.fontSize.md,
        fontWeight: '600',
        color: theme.colors.textPrimary,
        marginLeft: spacing.xs,
    },
    statusBadge: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    dateRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
        backgroundColor: theme.colors.gray50,
        padding: spacing.sm,
        borderRadius: borderRadius.md,
    },
    dateInfo: {
        alignItems: 'center',
        flex: 1,
    },
    dateLabel: {
        fontSize: 12,
        color: theme.colors.gray500,
        marginBottom: 2,
    },
    dateValue: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.textPrimary,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: spacing.xs,
    },
    daysCount: {
        fontSize: 14,
        fontWeight: 'bold',
        color: theme.colors.gray600,
    },
    viewLink: {
        fontSize: 13,
        color: theme.colors.primary,
        fontWeight: '600',
    },
    emptyState: {
        alignItems: 'center',
        marginTop: spacing.xxl,
    },
    emptyText: {
        color: theme.colors.gray500,
        fontSize: typography.fontSize.md,
        marginTop: spacing.sm,
    },
    fab: {
        position: 'absolute',
        right: spacing.lg,
        bottom: spacing.lg,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...shadows.medium,
        elevation: 8,
    },
});

export default LeaveApplicationScreen;
