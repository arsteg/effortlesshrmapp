import React, { useCallback, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Modal,
    TextInput,
    Alert,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { taskService } from '../../services/taskService';
import { theme } from '../../theme';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Loading } from '../../components/common/Loading';
import { useAppSelector } from '../../store/hooks';
import { TASK_STATUSES, TaskStatus } from '../../utils/constants';
import AssignTaskModal from '../../components/modals/AssignTaskModal';

// TM-013: a dedicated mobile task detail screen. Previously the "view task"
// chevron on the task list had no onPress handler at all — there was no way
// to see a task's full description, comments, attachments, or subtasks on
// mobile, and the only edit available was an unsafe one-tap status cycle
// (TM-007/TM-008/TM-009, fixed separately). This screen also replaces that
// tap-cycle with an explicit status picker that warns before leaving a
// terminal (Closed) status.

function getStatusColor(status: string) {
    switch (status) {
        case 'Done': return theme.colors.success;
        case 'In Progress': return theme.colors.primary;
        case 'ToDo': return theme.colors.gray500;
        case 'Closed': return theme.colors.error;
        default: return theme.colors.gray500;
    }
}

function getPriorityColor(priority: string) {
    switch (priority) {
        case 'Urgent': return theme.colors.error;
        case 'High': return '#f59e0b';
        case 'Normal': return theme.colors.info;
        default: return theme.colors.gray500;
    }
}

export const TaskDetailScreen = () => {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const taskId: string = route.params?.taskId;
    const { user } = useAppSelector((state) => state.auth);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [task, setTask] = useState<any>(null);
    const [assignees, setAssignees] = useState<any[]>([]);
    const [subtasks, setSubtasks] = useState<any[]>([]);
    const [comments, setComments] = useState<any[]>([]);
    const [attachments, setAttachments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');
    const [postingComment, setPostingComment] = useState(false);
    const [statusPickerVisible, setStatusPickerVisible] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [assignModalVisible, setAssignModalVisible] = useState(false);

    const load = useCallback(async (isRefresh = false) => {
        if (!taskId) return;
        if (isRefresh) setRefreshing(true); else setLoading(true);
        try {
            const [taskRes, subtaskRes, commentsRes, attachmentsRes] = await Promise.all([
                taskService.getTaskById(taskId),
                taskService.getSubtasks(taskId).catch(() => null),
                taskService.getComments(taskId).catch(() => null),
                taskService.getAttachments(taskId).catch(() => null),
            ]);

            if (taskRes?.status === 'success') {
                setTask(taskRes.data?.task || null);
                setAssignees(taskRes.data?.newTaskUserList || []);
            }
            if (subtaskRes?.data?.taskList) setSubtasks(subtaskRes.data.taskList);
            if (Array.isArray(commentsRes?.data)) setComments(commentsRes.data);
            if (attachmentsRes?.data?.newTaskAttachmentList) {
                setAttachments(attachmentsRes.data.newTaskAttachmentList);
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to load task');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [taskId]);

    useEffect(() => {
        load();
    }, [load]);

    const handleStatusSelect = async (status: TaskStatus) => {
        if (!task) return;
        const leavingClosed = task.status === 'Closed' && status !== 'Closed';
        const closingTask = status === 'Closed' && task.status !== 'Closed';

        const applyUpdate = async () => {
            setUpdatingStatus(true);
            try {
                const res = await taskService.updateTask(taskId, { status });
                if (res.status === 'success' || res.status === undefined) {
                    setTask({ ...task, status });
                    setStatusPickerVisible(false);
                } else {
                    Alert.alert('Error', res.message || 'Failed to update status');
                }
            } catch (error: any) {
                Alert.alert('Error', error.message || 'Failed to update status');
            } finally {
                setUpdatingStatus(false);
            }
        };

        if (leavingClosed) {
            Alert.alert(
                'Reopen this task?',
                'This task is currently closed. Are you sure you want to reopen it?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Reopen', onPress: applyUpdate },
                ]
            );
            return;
        }

        if (closingTask) {
            Alert.alert(
                'Close this task?',
                'This will mark the task as closed.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Close task', onPress: applyUpdate },
                ]
            );
            return;
        }

        applyUpdate();
    };

    const handleAddComment = async () => {
        if (!newComment.trim() || !user?.id) return;
        setPostingComment(true);
        try {
            const res = await taskService.addComment({
                content: newComment.trim(),
                author: user.id,
                task: taskId,
                commentedAt: new Date().toISOString(),
            });
            if (res.status === 'success' || res.status === undefined) {
                setNewComment('');
                // Re-fetch rather than optimistically splicing in the raw
                // response — keeps this screen's state shape consistent with
                // whatever the comments list endpoint actually returns.
                const commentsRes = await taskService.getComments(taskId);
                if (Array.isArray(commentsRes?.data)) setComments(commentsRes.data);
            } else {
                Alert.alert('Error', res.message || 'Failed to add comment');
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to add comment');
        } finally {
            setPostingComment(false);
        }
    };

    if (loading) {
        return <Loading message="Loading task..." />;
    }

    if (!task) {
        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="alert-circle-outline" size={48} color={theme.colors.gray400} />
                <Text style={styles.emptyText}>This task could not be found.</Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
        >
            <Card style={styles.section}>
                <Text style={styles.title}>{task.taskName}</Text>
                <View style={styles.badgeRow}>
                    <TouchableOpacity
                        style={[styles.statusBadge, { borderColor: getStatusColor(task.status) }]}
                        onPress={() => setStatusPickerVisible(true)}
                    >
                        <Text style={[styles.statusText, { color: getStatusColor(task.status) }]}>
                            {task.status || 'Unknown'}
                        </Text>
                        <Ionicons name="chevron-down" size={14} color={getStatusColor(task.status)} />
                    </TouchableOpacity>
                    <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) }]}>
                        <Text style={styles.priorityText}>{task.priority || 'Unknown'}</Text>
                    </View>
                </View>

                <Text style={styles.label}>Description</Text>
                <Text style={styles.description}>{task.description || 'No description provided'}</Text>

                <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                        <Ionicons name="calendar-outline" size={14} color={theme.colors.textSecondary} />
                        <Text style={styles.metaText}>
                            {task.startDate ? new Date(task.startDate).toLocaleDateString() : '—'}
                            {' → '}
                            {task.endDate ? new Date(task.endDate).toLocaleDateString() : '—'}
                        </Text>
                    </View>
                </View>
            </Card>

            <Card style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionHeader}>Assigned to</Text>
                    <TouchableOpacity onPress={() => setAssignModalVisible(true)}>
                        <Text style={styles.linkText}>Reassign</Text>
                    </TouchableOpacity>
                </View>
                {assignees.length === 0 ? (
                    <Text style={styles.emptySectionText}>Unassigned</Text>
                ) : (
                    assignees.map((a) => (
                        <Text key={a._id || a.id} style={styles.assigneeText}>
                            {a.user?.firstName} {a.user?.lastName}
                        </Text>
                    ))
                )}
            </Card>

            {subtasks.length > 0 && (
                <Card style={styles.section}>
                    <Text style={styles.sectionHeader}>Subtasks ({subtasks.length})</Text>
                    {subtasks.map((st) => (
                        <View key={st._id || st.id} style={styles.subtaskRow}>
                            <Ionicons
                                name={st.status === 'Done' || st.status === 'Closed' ? 'checkmark-circle' : 'ellipse-outline'}
                                size={16}
                                color={getStatusColor(st.status)}
                            />
                            <Text style={styles.subtaskText} numberOfLines={1}>{st.taskName}</Text>
                        </View>
                    ))}
                </Card>
            )}

            <Card style={styles.section}>
                <Text style={styles.sectionHeader}>Attachments ({attachments.length})</Text>
                {attachments.length === 0 ? (
                    <Text style={styles.emptySectionText}>No attachments</Text>
                ) : (
                    attachments.map((att) => (
                        <View key={att._id || att.id} style={styles.attachmentRow}>
                            <Ionicons name="document-attach-outline" size={16} color={theme.colors.textSecondary} />
                            <Text style={styles.attachmentText} numberOfLines={1}>{att.attachmentName}</Text>
                        </View>
                    ))
                )}
            </Card>

            <Card style={[styles.section, styles.lastSection]}>
                <Text style={styles.sectionHeader}>Comments ({comments.length})</Text>
                {comments.length === 0 ? (
                    <Text style={styles.emptySectionText}>No comments yet</Text>
                ) : (
                    comments.map((c) => (
                        <View key={c._id || c.id} style={styles.commentRow}>
                            <Text style={styles.commentAuthor}>
                                {c.author?.firstName ? `${c.author.firstName} ${c.author.lastName || ''}`.trim() : 'Someone'}
                            </Text>
                            <Text style={styles.commentContent}>{c.content}</Text>
                        </View>
                    ))
                )}

                <View style={styles.addCommentRow}>
                    <TextInput
                        style={styles.commentInput}
                        placeholder="Add a comment..."
                        value={newComment}
                        onChangeText={setNewComment}
                        multiline
                    />
                    <Button
                        title="Post"
                        onPress={handleAddComment}
                        loading={postingComment}
                        disabled={!newComment.trim()}
                        style={styles.postButton}
                    />
                </View>
            </Card>

            <Modal visible={statusPickerVisible} transparent animationType="fade" onRequestClose={() => setStatusPickerVisible(false)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setStatusPickerVisible(false)}>
                    <View style={styles.statusSheet}>
                        <Text style={styles.statusSheetTitle}>Change status</Text>
                        {TASK_STATUSES.map((status) => (
                            <TouchableOpacity
                                key={status}
                                style={styles.statusOption}
                                disabled={updatingStatus}
                                onPress={() => handleStatusSelect(status)}
                            >
                                <View style={[styles.statusDot, { backgroundColor: getStatusColor(status) }]} />
                                <Text style={styles.statusOptionText}>{status}</Text>
                                {task.status === status && (
                                    <Ionicons name="checkmark" size={18} color={theme.colors.primary} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>

            <AssignTaskModal
                visible={assignModalVisible}
                taskId={taskId}
                onClose={() => setAssignModalVisible(false)}
                onAssigned={() => {
                    setAssignModalVisible(false);
                    load();
                }}
            />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.backgroundSecondary },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.lg },
    emptyText: { marginTop: theme.spacing.md, color: theme.colors.gray500, fontSize: theme.typography.fontSize.md },
    section: { margin: theme.spacing.md, marginBottom: 0 },
    lastSection: { marginBottom: theme.spacing.xl },
    title: { fontSize: theme.typography.fontSize.xl, fontWeight: 'bold', color: theme.colors.textPrimary, marginBottom: theme.spacing.sm },
    badgeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.md, gap: theme.spacing.sm },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: theme.spacing.md, paddingVertical: 6, borderRadius: theme.borderRadius.md, borderWidth: 1, gap: 4 },
    statusText: { fontSize: 12, fontWeight: 'bold' },
    priorityBadge: { paddingHorizontal: theme.spacing.sm, paddingVertical: 4, borderRadius: theme.borderRadius.round },
    priorityText: { fontSize: 10, fontWeight: 'bold', color: theme.colors.white },
    label: { fontSize: theme.typography.fontSize.xs, color: theme.colors.textSecondary, marginBottom: 2, textTransform: 'uppercase' },
    description: { fontSize: theme.typography.fontSize.md, color: theme.colors.textPrimary, marginBottom: theme.spacing.md },
    metaRow: { flexDirection: 'row' },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: 12, color: theme.colors.textSecondary },
    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.sm },
    sectionHeader: { fontSize: theme.typography.fontSize.md, fontWeight: 'bold', color: theme.colors.textPrimary, marginBottom: theme.spacing.sm },
    linkText: { color: theme.colors.primary, fontWeight: '600', fontSize: theme.typography.fontSize.sm },
    emptySectionText: { color: theme.colors.gray500, fontSize: theme.typography.fontSize.sm },
    assigneeText: { fontSize: theme.typography.fontSize.md, color: theme.colors.textPrimary, marginBottom: 4 },
    subtaskRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    subtaskText: { flex: 1, color: theme.colors.textPrimary },
    attachmentRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    attachmentText: { flex: 1, color: theme.colors.textPrimary },
    commentRow: { marginBottom: theme.spacing.md },
    commentAuthor: { fontWeight: 'bold', color: theme.colors.textPrimary, marginBottom: 2 },
    commentContent: { color: theme.colors.textSecondary },
    addCommentRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: theme.spacing.sm },
    commentInput: { flex: 1, borderWidth: 1, borderColor: theme.colors.gray200, borderRadius: theme.borderRadius.md, padding: theme.spacing.sm, minHeight: 40, maxHeight: 100, color: theme.colors.textPrimary },
    postButton: { flex: 0, paddingHorizontal: theme.spacing.md },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    statusSheet: { backgroundColor: theme.colors.white, borderTopLeftRadius: theme.borderRadius.lg, borderTopRightRadius: theme.borderRadius.lg, padding: theme.spacing.lg },
    statusSheetTitle: { fontSize: theme.typography.fontSize.lg, fontWeight: 'bold', marginBottom: theme.spacing.md, color: theme.colors.textPrimary },
    statusOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: theme.spacing.sm, gap: theme.spacing.sm },
    statusDot: { width: 10, height: 10, borderRadius: 5 },
    statusOptionText: { flex: 1, fontSize: theme.typography.fontSize.md, color: theme.colors.textPrimary },
});

export default TaskDetailScreen;
