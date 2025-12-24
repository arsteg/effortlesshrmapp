import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
    RefreshControl
} from 'react-native';
import { taskService } from '../../services/taskService';
import { theme } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '../../store/hooks';
import { useNavigation } from '@react-navigation/native';
import { Dropdown } from 'react-native-element-dropdown';
import { Card } from '../../components/common/Card';
import AddNewTaskModal from '../../components/modals/AddNewTaskModal';
import { Project } from '../../types';

interface TeamMember {
    id: string;
    name: string;
    email: string;
}

export const TaskScreen = () => {
    const navigation = useNavigation();
    const { isAdminPortal, user } = useAppSelector((state) => state.auth);
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [selectedUser, setSelectedUser] = useState<TeamMember | null>(null);
    const [isFocus, setIsFocus] = useState(false);

    useEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity onPress={() => loadTasks(true)} style={{ marginRight: 15 }}>
                    <Ionicons name="refresh" size={24} color={theme.colors.white} />
                </TouchableOpacity>
            ),
        });
    }, [navigation]);

    useEffect(() => {
        if (isAdminPortal) {
            loadTeamMembers();
        } else {
            // Reset for regular user
            setSelectedUser({ id: user?.id || '', name: 'Me', email: user?.email || '' });
        }
    }, [isAdminPortal]);

    useEffect(() => {
        loadTasks();
    }, [isAdminPortal, selectedUser]);

    const loadTeamMembers = async () => {
        if (!user?.id) return;

        try {
            // Add current user as "Me"
            const members: TeamMember[] = [
                { id: user.id, name: 'Me', email: user.email || '' }
            ];

            // Load subordinates
            const response = await taskService.getSubordinates(user.id);

            // Handle different response structures
            const subordinatesData = Array.isArray(response) ? response : (response.data || []);

            if (subordinatesData && subordinatesData.length > 0) {
                const subordinates: TeamMember[] = subordinatesData
                    .filter((u: any) => u.id !== user.id)
                    .map((u: any) => ({
                        id: u.id,
                        name: u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : (u.FullName || u.email || 'Unknown'),
                        email: u.email || ''
                    }))
                    .sort((a: TeamMember, b: TeamMember) =>
                        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
                    );

                members.push(...subordinates);
            }

            setTeamMembers(members);
            setSelectedUser(members[0]); // Default to "Me"
        } catch (error) {
            console.error('Failed to load team members:', error);
            const fallbackMember = { id: user.id, name: 'Me', email: user.email || '' };
            setTeamMembers([fallbackMember]);
            setSelectedUser(fallbackMember);
        }
    };

    const loadProjects = async () => {
        if (!user?.id) return;

        try {
            // Add current user as "Me"
            const projects: Project[] = [];

            // Load subordinates
            const response = await taskService.projectListByUser(user.id);

            // Handle different response structures
            const subordinatesData = Array.isArray(response) ? response : (response.data || []);

            if (subordinatesData && subordinatesData.length > 0) {
                const subordinates: TeamMember[] = subordinatesData
                    .filter((u: any) => u.id !== user.id)
                    .map((u: any) => ({
                        id: u.id,
                        name: u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : (u.FullName || u.email || 'Unknown'),
                        email: u.email || ''
                    }))
                    .sort((a: TeamMember, b: TeamMember) =>
                        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
                    );

                projects.push(...subordinates);
            }

            setProjects(projects);
            setSelectedUser(members[0]); // Default to "Me"
        } catch (error) {
            console.error('Failed to load team members:', error);
            const fallbackMember = { id: user.id, name: 'Me', email: user.email || '' };
            setTeamMembers([fallbackMember]);
            setSelectedUser(fallbackMember);
        }
    };

    const loadTasks = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            let response;
            response = await taskService.getTasksByUser({
                userId: isAdminPortal ? selectedUser?.id : user?.id,
                skip: 0,
                next: 100
            });

            if (response.status === 'success') {
                setTasks(response.data?.taskList || []);
            } else {
                Alert.alert('Error', response.message || 'Failed to load tasks');
            }
        } catch (error: any) {
            console.error('Failed to load tasks', error);
            Alert.alert('Error', error.message || 'An unexpected error occurred');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleDeleteTask = (taskId: string) => {
        Alert.alert(
            'Delete Task',
            'Are you sure you want to delete this task?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const res = await taskService.deleteTask(taskId);
                            if (res.status === 'success') {
                                Alert.alert('Success', 'Task deleted successfully');
                                loadTasks();
                            } else {
                                Alert.alert('Error', res.message || 'Failed to delete task');
                            }
                        } catch (error: any) {
                            Alert.alert('Error', error.message || 'Failed to delete task');
                        }
                    }
                }
            ]
        );
    };

    const handleStatusUpdate = async (taskId: string, currentStatus: string) => {
        const nextStatus = currentStatus === 'To Do' ? 'In Progress' : currentStatus === 'In Progress' ? 'Done' : 'To Do';

        try {
            const res = await taskService.updateTask(taskId, { status: nextStatus });
            if (res.status === 'success') {
                loadTasks();
            } else {
                Alert.alert('Error', res.message || 'Failed to update status');
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to update status');
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.header}>
                <View style={styles.titleContainer}>
                    <Text style={styles.title} numberOfLines={1}>{item.taskName}</Text>
                    <Text style={styles.projectText}>{item.project?.projectName || 'No Project'}</Text>
                </View>
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
                    <Text style={styles.priorityText}>{item.priority}</Text>
                </View>
            </View>

            <Text style={styles.description} numberOfLines={2}>{item.description || 'No description provided'}</Text>

            <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                    <Ionicons name="calendar-outline" size={14} color={theme.colors.textSecondary} />
                    <Text style={styles.metaText}>{new Date(item.startDate).toLocaleDateString()}</Text>
                </View>
                {isAdminPortal && item.TaskUsers && item.TaskUsers.length > 0 && (
                    <View style={styles.metaItem}>
                        <Ionicons name="person-outline" size={14} color={theme.colors.textSecondary} />
                        <Text style={styles.metaText}>{item.TaskUsers[0].user?.firstName}</Text>
                    </View>
                )}
            </View>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.statusBadge, { borderColor: getStatusColor(item.status) }]}
                    onPress={() => handleStatusUpdate(item._id || item.id, item.status)}
                >
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                </TouchableOpacity>

                <View style={styles.actions}>
                    {isAdminPortal && (
                        <TouchableOpacity onPress={() => handleDeleteTask(item._id || item.id)} style={styles.actionButton}>
                            <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.actionButton}>
                        <Ionicons name="chevron-forward" size={20} color={theme.colors.gray500} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'Critical': return theme.colors.error;
            case 'High': return '#f59e0b';
            case 'Medium': return theme.colors.info;
            case 'Low': return theme.colors.success;
            default: return theme.colors.gray500;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Done': return theme.colors.success;
            case 'In Progress': return theme.colors.primary;
            case 'To Do': return theme.colors.gray500;
            case 'Blocked': return theme.colors.error;
            default: return theme.colors.gray500;
        }
    };

    return (
        <View style={styles.container}>
            {isAdminPortal && (
                <Card style={styles.memberCard}>
                    <Text style={styles.controlLabel}>
                        Viewing Tasks For:{' '}
                        <Text style={styles.selectedMemberText}>
                            {selectedUser?.name || 'Select a member'}
                        </Text>
                    </Text>

                    <Dropdown
                        style={[styles.dropdown, isFocus && { borderColor: theme.colors.primary }]}
                        placeholderStyle={styles.placeholderStyle}
                        selectedTextStyle={styles.selectedTextStyle}
                        inputSearchStyle={styles.inputSearchStyle}
                        iconStyle={styles.iconStyle}
                        data={teamMembers.map(member => ({
                            label: member.name,
                            value: member.id,
                        }))}
                        search
                        maxHeight={300}
                        labelField="label"
                        valueField="value"
                        placeholder={!isFocus ? 'Select member' : '...'}
                        searchPlaceholder="Search..."
                        value={selectedUser?.id}
                        onFocus={() => setIsFocus(true)}
                        onBlur={() => setIsFocus(false)}
                        onChange={item => {
                            const member = teamMembers.find(m => m.id === item.value);
                            if (member) setSelectedUser(member);
                            setIsFocus(false);
                        }}
                    />
                </Card>
            )}
            {loading ? (
                <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
            ) : (
                <FlatList
                    data={tasks}
                    renderItem={renderItem}
                    keyExtractor={(item) => item._id || item.id || Math.random().toString()}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => loadTasks(true)} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="list" size={64} color={theme.colors.gray300} />
                            <Text style={styles.emptyText}>No tasks found.</Text>
                        </View>
                    }
                />
            )}

            <TouchableOpacity
                style={styles.fab}
                onPress={() => setIsModalVisible(true)}
            >
                <Ionicons name="add" size={30} color={theme.colors.white} />
            </TouchableOpacity>

            <AddNewTaskModal
                isVisible={isModalVisible}
                onClose={() => setIsModalVisible(false)}
                onSuccess={() => loadTasks()}
                isAdmin={isAdminPortal}
            />
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
        paddingBottom: 80,
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
        alignItems: 'flex-start',
        marginBottom: theme.spacing.sm,
    },
    titleContainer: {
        flex: 1,
    },
    title: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: 'bold',
        color: theme.colors.textPrimary,
    },
    projectText: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.textSecondary,
        marginTop: 2,
    },
    priorityBadge: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 2,
        borderRadius: theme.borderRadius.round,
        marginLeft: theme.spacing.sm,
    },
    priorityText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: theme.colors.white,
    },
    description: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.md,
    },
    metaRow: {
        flexDirection: 'row',
        marginBottom: theme.spacing.md,
        gap: theme.spacing.md,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: theme.colors.gray100,
        paddingTop: theme.spacing.sm,
    },
    statusBadge: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: 4,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionButton: {
        marginLeft: theme.spacing.md,
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
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 100,
    },
    emptyText: {
        fontSize: theme.typography.fontSize.lg,
        color: theme.colors.gray500,
        marginTop: theme.spacing.md,
    },
    memberCard: {
        margin: theme.spacing.md,
        padding: theme.spacing.sm,
    },
    controlLabel: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.xs,
    },
    selectedMemberText: {
        color: theme.colors.primary,
        fontWeight: 'bold',
    },
    dropdown: {
        height: 40,
        borderColor: theme.colors.gray300,
        borderWidth: 1,
        borderRadius: theme.borderRadius.sm,
        paddingHorizontal: 8,
    },
    placeholderStyle: {
        fontSize: 14,
        color: theme.colors.gray400,
    },
    selectedTextStyle: {
        fontSize: 14,
        color: theme.colors.textPrimary,
    },
    inputSearchStyle: {
        height: 40,
        fontSize: 14,
    },
    iconStyle: {
        width: 20,
        height: 20,
    },
});
