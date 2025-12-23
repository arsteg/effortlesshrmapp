import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Modal,
    TextInput,
    Alert,
    ScrollView,
    ActivityIndicator,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '../../store/hooks';
import { theme } from '../../theme';
import { manualTimeService } from '../../services/manualTimeService';
import { authService } from '../../services/authService';
import { taskService } from '../../services/taskService';
import { Dropdown } from 'react-native-element-dropdown';
import DateTimePicker from '@react-native-community/datetimepicker';

const ManualTimeScreen = () => {
    const { user } = useAppSelector((state) => state.auth);
    const [requests, setRequests] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form Data
    const [managers, setManagers] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [tasks, setTasks] = useState<any[]>([]);

    const [selectedManager, setSelectedManager] = useState('');
    const [selectedProject, setSelectedProject] = useState('');
    const [selectedTask, setSelectedTask] = useState('');
    const [reason, setReason] = useState('');

    const [fromDate, setFromDate] = useState(new Date());
    const [toDate, setToDate] = useState(new Date());
    const [showPicker, setShowPicker] = useState<'from' | 'to' | null>(null);

    // Edit Mode
    const [editMode, setEditMode] = useState(false);
    const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

    useEffect(() => {
        if (user?.id) {
            loadRequests();
            loadFormData();
        }
    }, [user?.id]);

    const loadRequests = async () => {
        if (!user?.id) return;
        setIsLoading(true);
        try {
            const res = await manualTimeService.getManualTimeRequestsByUser(user.id);
            setRequests(res.data || []);
        } catch (error) {
            console.error('Failed to load manual time requests', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadFormData = async () => {
        if (!user?.id) return;
        try {
            const managersRes = await authService.getUserManagers(user.id);
            const projectsRes = await authService.getUserProjects(user.id);

            setManagers((managersRes.data || []).map((m: any) => ({ label: m.name, value: m.id })));
            setProjects((projectsRes.data || []).map((p: any) => ({ label: p.projectName, value: p.id })));

        } catch (error) {
            console.error('Failed to load form data', error);
        }
    };

    const loadTasks = async (projectId: string) => {
        if (!user?.id || !projectId) return;
        try {
            const res = await taskService.getUserTaskListByProject(user.id, projectId);
            const taskList = res && (res['taskList'] || res.data?.taskList || []);
            setTasks(taskList.map((t: any) => ({ label: t.name || t.taskName, value: t.id || t._id })));
        } catch (error) {
            console.error('Failed to load tasks', error);
        }
    };

    const handleProjectChange = (item: any) => {
        setSelectedProject(item.value);
        loadTasks(item.value);
        setSelectedTask('');
    };

    const handleSave = async () => {
        if (!selectedManager || !selectedProject || !selectedTask || !reason) {
            Alert.alert('Error', 'Please fill all required fields');
            return;
        }

        if (fromDate > toDate) {
            Alert.alert('Error', 'From Date cannot be greater than To Date');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                user: user.id,
                manager: selectedManager,
                project: selectedProject,
                task: selectedTask,
                reason: reason,
                fromDate: fromDate.toISOString(),
                toDate: toDate.toISOString(),
                date: new Date().toISOString(), // Submission date
                requestId: editMode ? selectedRequestId : undefined
            };

            if (editMode) {
                await manualTimeService.updateManualTimeRequest(payload);
                Alert.alert('Success', 'Request updated successfully');
            } else {
                await manualTimeService.addManualTimeRequest(payload);
                Alert.alert('Success', 'Request added successfully');
            }

            setModalVisible(false);
            resetForm();
            loadRequests();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to save request');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = (id: string) => {
        Alert.alert('Confirm', 'Are you sure you want to delete this request?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await manualTimeService.deleteManualTimeRequest(id);
                        loadRequests();
                    } catch (error) {
                        Alert.alert('Error', 'Failed to delete request');
                    }
                }
            }
        ]);
    };

    const handleEdit = (item: any) => {
        setEditMode(true);
        setSelectedRequestId(item._id || item.id);
        setSelectedManager(item.manager?.id || item.manager);
        setSelectedProject(item.project?.id || item.project);
        // Load tasks for this project
        const projId = item.project?.id || item.project;
        if (projId) loadTasks(projId);

        setSelectedTask(item.task?.id || item.task?._id || item.task);
        setReason(item.reason);
        setFromDate(new Date(item.fromDate));
        setToDate(new Date(item.toDate));
        setModalVisible(true);
    };

    const resetForm = () => {
        setEditMode(false);
        setSelectedRequestId(null);
        setSelectedManager('');
        setSelectedProject('');
        setSelectedTask('');
        setReason('');
        setFromDate(new Date());
        setToDate(new Date());
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.projectName}>{item.project?.projectName || 'Unknown Project'}</Text>
                <Text style={[
                    styles.status,
                    { color: item.status === 'approved' ? 'green' : item.status === 'rejected' ? 'red' : 'orange' }
                ]}>
                    {item.status || 'Pending'}
                </Text>
            </View>
            <Text style={styles.taskName}>Task: {item.task?.taskName || item.task?.name || 'Unknown Task'}</Text>
            <Text style={styles.dateText}>From: {new Date(item.fromDate).toLocaleString()}</Text>
            <Text style={styles.dateText}>To: {new Date(item.toDate).toLocaleString()}</Text>
            <Text style={styles.reason}>Reason: {item.reason}</Text>

            {item.status === 'pending' && (
                <View style={styles.actions}>
                    <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionBtn}>
                        <Ionicons name="create-outline" size={20} color={theme.colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item._id || item.id)} style={styles.actionBtn}>
                        <Ionicons name="trash-outline" size={20} color="red" />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Manual Time Requests</Text>
                <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => {
                        resetForm();
                        setModalVisible(true);
                    }}
                >
                    <Ionicons name="add" size={24} color="white" />
                </TouchableOpacity>
            </View>

            {isLoading ? (
                <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
            ) : (
                <FlatList
                    data={requests}
                    keyExtractor={(item, index) => item._id || item.id || index.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={<Text style={styles.emptyText}>No requests found</Text>}
                />
            )}

            <Modal
                visible={modalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{editMode ? 'Edit Request' : 'New Request'}</Text>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <Ionicons name="close" size={24} color="black" />
                        </TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={styles.formContent}>
                        <Text style={styles.label}>Manager</Text>
                        <Dropdown
                            style={styles.dropdown}
                            data={managers}
                            labelField="label"
                            valueField="value"
                            placeholder="Select Manager"
                            value={selectedManager}
                            onChange={item => setSelectedManager(item.value)}
                        />

                        <Text style={styles.label}>Project</Text>
                        <Dropdown
                            style={styles.dropdown}
                            data={projects}
                            labelField="label"
                            valueField="value"
                            placeholder="Select Project"
                            value={selectedProject}
                            onChange={handleProjectChange}
                        />

                        <Text style={styles.label}>Task</Text>
                        <Dropdown
                            style={styles.dropdown}
                            data={tasks}
                            labelField="label"
                            valueField="value"
                            placeholder="Select Task"
                            value={selectedTask}
                            onChange={item => setSelectedTask(item.value)}
                        />

                        <Text style={styles.label}>From Date & Time</Text>
                        <TouchableOpacity style={styles.dateBtn} onPress={() => setShowPicker('from')}>
                            <Text>{fromDate.toLocaleString()}</Text>
                        </TouchableOpacity>

                        <Text style={styles.label}>To Date & Time</Text>
                        <TouchableOpacity style={styles.dateBtn} onPress={() => setShowPicker('to')}>
                            <Text>{toDate.toLocaleString()}</Text>
                        </TouchableOpacity>

                        {showPicker && (
                            <DateTimePicker
                                value={showPicker === 'from' ? fromDate : toDate}
                                mode="datetime"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={(event, date) => {
                                    const type = showPicker;
                                    setShowPicker(null);
                                    if (date) {
                                        if (type === 'from') setFromDate(date);
                                        else setToDate(date);
                                    }
                                }}
                            />
                        )}

                        <Text style={styles.label}>Reason</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            multiline
                            numberOfLines={4}
                            value={reason}
                            onChangeText={setReason}
                            placeholder="Enter reason"
                        />

                        <TouchableOpacity
                            style={[styles.submitBtn, isSubmitting && styles.disabledBtn]}
                            onPress={handleSave}
                            disabled={isSubmitting}
                        >
                            <Text style={styles.submitBtnText}>{isSubmitting ? 'Saving...' : 'Submit Request'}</Text>
                        </TouchableOpacity>
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
    addBtn: {
        backgroundColor: theme.colors.primary,
        padding: 8,
        borderRadius: 20,
    },
    loader: {
        marginTop: 20,
    },
    listContent: {
        padding: 16,
    },
    card: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    projectName: {
        fontWeight: 'bold',
        fontSize: 16,
        color: theme.colors.text,
    },
    status: {
        fontWeight: 'bold',
        textTransform: 'capitalize',
    },
    taskName: {
        fontSize: 14,
        color: theme.colors.gray800,
        marginBottom: 4,
    },
    dateText: {
        fontSize: 12,
        color: theme.colors.gray600,
        marginBottom: 2,
    },
    reason: {
        fontSize: 14,
        color: theme.colors.gray800,
        fontStyle: 'italic',
        marginTop: 4,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 8,
    },
    actionBtn: {
        marginLeft: 16,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 20,
        color: theme.colors.gray500,
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
    formContent: {
        padding: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.gray800,
        marginBottom: 8,
        marginTop: 12,
    },
    input: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: theme.colors.gray300,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    dropdown: {
        height: 50,
        borderColor: theme.colors.gray300,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 8,
        backgroundColor: 'white',
    },
    dateBtn: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: theme.colors.gray300,
        borderRadius: 8,
        padding: 12,
    },
    submitBtn: {
        backgroundColor: theme.colors.primary,
        padding: 16,
        borderRadius: 8,
        marginTop: 24,
        alignItems: 'center',
    },
    disabledBtn: {
        opacity: 0.7,
    },
    submitBtnText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default ManualTimeScreen;
