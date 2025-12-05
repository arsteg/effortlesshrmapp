import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { leaveService, LeaveData } from '../../services/leaveService';
import { theme } from '../../theme';
import { Ionicons } from '@expo/vector-icons';

export const LeaveReportScreen = ({ navigation }: any) => {
    const [leaves, setLeaves] = useState<LeaveData[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadLeaves();
    }, []);

    const loadLeaves = async () => {
        setLoading(true);
        try {
            const now = new Date();
            const fromDate = new Date(now.getFullYear(), now.getMonth(), 1).toDateString();
            const toDate = now.toDateString();

            const data = await leaveService.getLeaves({
                fromdate: fromDate,
                todate: toDate,
            });
            setLeaves(data || []);
        } catch (error) {
            console.error('Failed to load leaves', error);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: { item: LeaveData }) => (
        <View style={styles.card}>
            <View style={styles.header}>
                <Text style={styles.name}>{item.firstName} {item.lastName}</Text>
                <View style={styles.countBadge}>
                    <Text style={styles.countText}>{item.count} Days</Text>
                </View>
            </View>
            <Text style={styles.type}>{item.name}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            {loading ? (
                <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
            ) : (
                <FlatList
                    data={leaves}
                    renderItem={renderItem}
                    keyExtractor={(item, index) => index.toString()}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.emptyText}>No leave records found.</Text>}
                />
            )}


            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('ApplyLeave')}
            >
                <Ionicons name="add" size={30} color={theme.colors.white} />
            </TouchableOpacity>
        </View >
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
    countBadge: {
        backgroundColor: theme.colors.primaryLight,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.borderRadius.round,
    },
    countText: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: 'bold',
        color: theme.colors.primaryDark,
    },
    type: {
        fontSize: theme.typography.fontSize.md,
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
