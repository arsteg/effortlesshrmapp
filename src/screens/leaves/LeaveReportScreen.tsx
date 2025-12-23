import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { leaveService } from '../../services/leaveService';
import { theme } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '../../store/hooks';

export const LeaveReportScreen = ({ navigation }: any) => {
    const { user, isAdminPortal } = useAppSelector((state) => state.auth);
    const [leaves, setLeaves] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadLeaves();
    }, [isAdminPortal]);

    const loadLeaves = async () => {
        setLoading(true);
        try {
            const pagination = { skip: '0', next: '100' };
            let res;
            if (isAdminPortal) {
                // Admin: List all applications (simplified pagination)
                res = await leaveService.getLeaveApplicationList(pagination);
            } else {
                if (user?.id) {
                    res = await leaveService.getLeaveApplicationByUser(user.id, pagination);
                }
            }

            // Adjust based on API Response structure (res.data for list?)
            const list = res?.data || res || [];
            if (Array.isArray(list)) {
                setLeaves(list);
            } else {
                setLeaves([]);
            }

        } catch (error) {
            console.error('Failed to load leaves', error);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: { item: any }) => {
        // Angular structure: 
        // user: {firstName...}, leaveCategory: {name...}, fromDate, toDate, status check
        const empName = item.user ? `${item.user.firstName} ${item.user.lastName || ''}` : 'Unknown';
        const typeName = item.leaveCategory ? item.leaveCategory.name : 'Leave';
        const status = item.approvalStatus || 'Pending'; // Guessing field name, might be status or approvalStatus

        return (
            <View style={styles.card}>
                <View style={styles.header}>
                    <Text style={styles.name}>{empName}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: status === 'Approved' ? '#e6fffa' : '#fff5f5' }]}>
                        <Text style={[styles.statusText, { color: status === 'Approved' ? 'green' : 'red' }]}>{status}</Text>
                    </View>
                </View>
                <Text style={styles.type}>{typeName}</Text>
                <Text style={styles.date}>
                    {new Date(item.fromDate).toLocaleDateString()} - {new Date(item.toDate).toLocaleDateString()}
                </Text>
                <Text style={styles.reason} numberOfLines={2}>{item.reason}</Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {loading ? (
                <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
            ) : (
                <FlatList
                    data={leaves}
                    renderItem={renderItem}
                    keyExtractor={(item, index) => item.id || item._id || index.toString()}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.emptyText}>No leave records found.</Text>}
                />
            )}

            {!isAdminPortal && (
                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => navigation.navigate('ApplyLeave')}
                >
                    <Ionicons name="add" size={30} color={theme.colors.white} />
                </TouchableOpacity>
            )}
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
    name: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: 'bold',
        color: theme.colors.textPrimary,
    },
    statusBadge: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 2,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    type: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: '600',
        color: theme.colors.textPrimary,
        marginBottom: 4,
    },
    date: {
        fontSize: 14,
        color: theme.colors.gray600,
        marginBottom: 4,
    },
    reason: {
        fontSize: 14,
        color: theme.colors.gray500,
        fontStyle: 'italic',
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
