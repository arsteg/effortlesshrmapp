import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { taskService, TaskItem } from '../../services/taskService';
import { theme } from '../../theme';
import { Ionicons } from '@expo/vector-icons';

export const TaskScreen = () => {
    const [tasks, setTasks] = useState<TaskItem[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadTasks();
    }, []);

    const loadTasks = async () => {
        setLoading(true);
        try {
            const data = await taskService.getTasks({
                pageNumber: 1,
                pageSize: 20,
            });
            setTasks(data || []);
        } catch (error) {
            console.error('Failed to load tasks', error);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: { item: TaskItem }) => (
        <View style={styles.card}>
            <View style={styles.header}>
                <Text style={styles.title}>{item.taskName}</Text>
                <View style={[styles.priorityBadge, { backgroundColor: item.priority === 'High' ? theme.colors.error : theme.colors.info }]}>
                    <Text style={styles.priorityText}>{item.priority}</Text>
                </View>
            </View>
            <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
            <View style={styles.footer}>
                <View style={styles.dateBlock}>
                    <Ionicons name="calendar-outline" size={16} color={theme.colors.textSecondary} />
                    <Text style={styles.dateText}>{new Date(item.dueDate).toLocaleDateString()}</Text>
                </View>
                <Text style={[styles.statusText, { color: theme.colors.primary }]}>{item.status}</Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {loading ? (
                <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
            ) : (
                <FlatList
                    data={tasks}
                    renderItem={renderItem}
                    keyExtractor={(item, index) => index.toString()}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.emptyText}>No tasks found.</Text>}
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
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    title: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: 'bold',
        color: theme.colors.textPrimary,
        flex: 1,
    },
    priorityBadge: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.borderRadius.round,
        marginLeft: theme.spacing.sm,
    },
    priorityText: {
        fontSize: theme.typography.fontSize.xs,
        fontWeight: 'bold',
        color: theme.colors.white,
    },
    description: {
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.md,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dateBlock: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    dateText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.textSecondary,
    },
    statusText: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: 'bold',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: theme.spacing.xl,
        color: theme.colors.textSecondary,
    },
});
