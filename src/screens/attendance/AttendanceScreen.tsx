import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { attendanceService, AttendanceData } from '../../services/attendanceService';
import { theme } from '../../theme';
import { Ionicons } from '@expo/vector-icons';

export const AttendanceScreen = () => {
    const [attendance, setAttendance] = useState<AttendanceData[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadAttendance();
    }, []);

    const loadAttendance = async () => {
        setLoading(true);
        try {
            const now = new Date();
            const fromDate = new Date(now.getFullYear(), now.getMonth(), 1).toDateString(); // Start of month
            const toDate = now.toDateString();

            const data = await attendanceService.getAttendance({
                fromdate: fromDate,
                todate: toDate,
            });
            setAttendance(data || []);
        } catch (error) {
            console.error('Failed to load attendance', error);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: { item: AttendanceData }) => (
        <View style={styles.card}>
            <View style={styles.header}>
                <Text style={styles.date}>{new Date(item.starttime).toLocaleDateString()}</Text>
                <Text style={styles.totalTime}>{Math.floor(item.total / 60)}h {item.total % 60}m</Text>
            </View>
            <View style={styles.row}>
                <View style={styles.timeBlock}>
                    <Ionicons name="log-in-outline" size={20} color={theme.colors.success} />
                    <Text style={styles.timeText}>{new Date(item.starttime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
                <View style={styles.timeBlock}>
                    <Ionicons name="log-out-outline" size={20} color={theme.colors.error} />
                    <Text style={styles.timeText}>{new Date(item.endtime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
            </View>
            <Text style={styles.activity}>{item.activity}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            {loading ? (
                <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
            ) : (
                <FlatList
                    data={attendance}
                    renderItem={renderItem}
                    keyExtractor={(item, index) => index.toString()}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.emptyText}>No attendance records found.</Text>}
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
        marginBottom: theme.spacing.sm,
    },
    date: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: 'bold',
        color: theme.colors.textPrimary,
    },
    totalTime: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: 'bold',
        color: theme.colors.primary,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.sm,
    },
    timeBlock: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    timeText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.textSecondary,
    },
    activity: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.textSecondary,
        fontStyle: 'italic',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: theme.spacing.xl,
        color: theme.colors.textSecondary,
    },
});
