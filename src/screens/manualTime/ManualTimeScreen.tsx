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
    const { user, isAdminPortal } = useAppSelector((state) => state.auth);
    const [requests, setRequests] = useState<any[]>([]);
    const [filteredRequests, setFilteredRequests] = useState<any[]>([]);
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
    const [showPicker, setShowPicker] = useState<'from' | 'to' | 'filterFrom' | 'filterTo' | null>(null);

    // Edit Mode
    const [editMode, setEditMode] = useState(false);
    const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

    // Admin Filters
    const [subordinates, setSubordinates] = useState<any[]>([]);
    const [filterEmployee, setFilterEmployee] = useState('');
    const [filterFromDate, setFilterFromDate] = useState<Date | null>(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    });
    const [filterToDate, setFilterToDate] = useState<Date | null>(() => {
        const d = new Date();
        d.setHours(23, 59, 59, 999);
        return d;
    });

    useEffect(() => {
        if (user?.id) {
            loadFormData();
            if (isAdminPortal) {
                // loadSubordinates(); // Dependent on requests
            } else {
                loadRequests();
            }
        }
    }, [user?.id, isAdminPortal]);

    const handleSearch = () => {
        loadRequests();
    };



    useEffect(() => {
        applyFilters();
    }, [requests, filterEmployee, filterFromDate, filterToDate]);

    const loadRequests = async () => {
        if (!user?.id) return;
        setIsLoading(true);
        try {
            let res;
            if (isAdminPortal) {
                res = await manualTimeService.getManualTimeRequestsForApprovalByUser(user.id);
            } else {
                res = await manualTimeService.getManualTimeRequestsByUser(user.id);
            }
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

    const loadSubordinates = async () => {
        // Assuming we can get the list of users this admin manages.
        // Since specific API for getting subordinates might not differ from generic 'get users' for some implementations,
        // we'll try to find a way. For now, we will extract unique users from the loaded requests if API doesn't provide it directly,
        // OR better, we use an endpoint if available.
        // Looking at loaded requests is a safe fallback for the dropdown content if we don't have a dedicated 'getSubordinates' endpoint handy.
        // Alternatively, we can use `authService`.
    };

    // Populate subordinates dropdown from the loaded requests for now to ensure we only filter by relevant people
    useEffect(() => {
        if (isAdminPortal && requests.length > 0) {
            const uniqueUsers = new Map();
            requests.forEach(req => {
                const u = req.user;
                if (u && !uniqueUsers.has(u._id || u.id)) {
                    uniqueUsers.set(u._id || u.id, {
                        label: `${u.firstName} ${u.lastName}`,
                        value: u._id || u.id
                    });
                }
            });
            setSubordinates(Array.from(uniqueUsers.values()));
        }
    }, [requests, isAdminPortal]);


    const applyFilters = () => {
        let filtered = [...requests];

        if (isAdminPortal) {
            if (filterEmployee) {
                filtered = filtered.filter(r => (r.user?._id === filterEmployee || r.user?.id === filterEmployee));
            }
            if (filterFromDate) {
                filtered = filtered.filter(r => new Date(r.fromDate) >= filterFromDate);
            }
            if (filterToDate) {
                filtered = filtered.filter(r => new Date(r.toDate) <= filterToDate);
            }
        }

        setFilteredRequests(filtered);
    };

    const loadTasks = async (projectId: string) => {
        if (!user?.id || !projectId) return;
        try {
            const res = await taskService.getUserTaskListByProject(user.id, projectId);
            const taskList = res && ((res as any)['taskList'] || res.data?.taskList || []);
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
        if (!user) {
            Alert.alert('Error', 'User not authenticated');
            return;
        }
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

    const handleStatusUpdate = async (request: any, status: 'approved' | 'rejected') => {
        try {
            setIsLoading(true);
            const payload = {
                ...request,
                requestId: request._id || request.id,
                status: status,
                project: request.project?._id || request.project?.id || request.project,
                manager: request.manager?._id || request.manager?.id || request.manager,
                user: request.user?._id || request.user?.id || request.user,
                task: request.task?._id || request.task?.id || request.task
            };

            await manualTimeService.updateManualTimeRequest(payload);
            Alert.alert('Success', `Request ${status} successfully`);
            loadRequests();
        } catch (error: any) {
            Alert.alert('Error', error.message || `Failed to ${status} request`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (item: any) => {
        setEditMode(true);
        setSelectedRequestId(item._id || item.id);
        setSelectedManager(item.manager?.id || item.manager?._id || item.manager);
        setSelectedProject(item.project?.id || item.project?._id || item.project);
        // Load tasks for this project
        const projId = item.project?.id || item.project?._id || item.project;
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
                <View style={{ flex: 1 }}>
                    {isAdminPortal && (
                        <Text style={styles.userNameText}>
                            {item.user?.firstName} {item.user?.lastName}
                        </Text>
                    )}
                    <Text style={styles.projectName}>{item.project?.projectName || 'Unknown Project'}</Text>
                </View>
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

            {isAdminPortal ? (
                <View style={[styles.actions, { justifyContent: 'space-between' }]}>
                    <View style={{ flex: 1 }} />
                    {item.status === 'pending' ? (
                        <View style={{ flexDirection: 'row' }}>
                            <TouchableOpacity
                                onPress={() => handleStatusUpdate(item, 'approved')}
                                style={[styles.actionBtn, { backgroundColor: theme.colors.success, padding: 8, borderRadius: 4, marginLeft: 8 }]}
                            >
                                <Text style={{ color: 'white', fontWeight: 'bold' }}>Approve</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => handleStatusUpdate(item, 'rejected')}
                                style={[styles.actionBtn, { backgroundColor: theme.colors.error, padding: 8, borderRadius: 4, marginLeft: 8 }]}
                            >
                                <Text style={{ color: 'white', fontWeight: 'bold' }}>Reject</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <Text style={{ color: theme.colors.gray500, fontStyle: 'italic' }}>
                            {item.status === 'approved' ? 'Approved' : 'Rejected'}
                        </Text>
                    )}
                </View>
            ) : (
                item.status === 'pending' && (
                    <View style={styles.actions}>
                        <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionBtn}>
                            <Ionicons name="create-outline" size={20} color={theme.colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDelete(item._id || item.id)} style={styles.actionBtn}>
                            <Ionicons name="trash-outline" size={20} color="red" />
                        </TouchableOpacity>
                    </View>
                )
            )}
        </View>
    );

    const renderFilters = () => (
        <View style={styles.filterContainer}>
            <Text style={styles.filterTitle}>Filters</Text>
            <View style={styles.filterRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                    <Dropdown
                        style={styles.filterDropdown}
                        data={[{ label: 'All Employees', value: '' }, ...subordinates]}
                        labelField="label"
                        valueField="value"
                        placeholder="Employee"
                        value={filterEmployee}
                        onChange={item => setFilterEmployee(item.value)}
                    />
                </View>
            </View>
            <View style={styles.filterRow}>
                <TouchableOpacity
                    style={styles.filterDateBtn}
                    onPress={() => setShowPicker('filterFrom')}
                >
                    <Text style={styles.filterDateText}>
                        {filterFromDate ? filterFromDate.toLocaleDateString() : 'From Date'}
                    </Text>
                    <Ionicons name="calendar-outline" size={16} color={theme.colors.gray600} />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.filterDateBtn}
                    onPress={() => setShowPicker('filterTo')}
                >
                    <Text style={styles.filterDateText}>
                        {filterToDate ? filterToDate.toLocaleDateString() : 'To Date'}
                    </Text>
                    <Ionicons name="calendar-outline" size={16} color={theme.colors.gray600} />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterDateBtn, { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }]}
                    onPress={handleSearch}
                >
                    <Text style={[styles.filterDateText, { color: 'white', fontWeight: 'bold' }]}>
                        Search
                    </Text>
                    <Ionicons name="search" size={16} color="white" />
                </TouchableOpacity>
            </View>
            <TouchableOpacity
                style={styles.clearFilterBtn}
                onPress={() => {
                    setFilterEmployee('');
                    setFilterFromDate(null);
                    setFilterToDate(null);
                }}
            >
                <Text style={styles.clearFilterText}>Clear Filters</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>
                    {isAdminPortal ? 'Manual Time Approvals' : 'Manual Time Requests'}
                </Text>
                {!isAdminPortal && (
                    <TouchableOpacity
                        style={styles.addBtn}
                        onPress={() => {
                            resetForm();
                            setModalVisible(true);
                        }}
                    >
                        <Ionicons name="add" size={24} color="white" />
                    </TouchableOpacity>
                )}
            </View>

            {isAdminPortal && renderFilters()}

            {isLoading ? (
                <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
            ) : (
                <FlatList
                    data={filteredRequests}
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

                        {(showPicker === 'from' || showPicker === 'to') && (
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
            {(showPicker === 'filterFrom' || showPicker === 'filterTo') && (
                <DateTimePicker
                    value={showPicker === 'filterFrom' ? (filterFromDate || new Date()) : (filterToDate || new Date())}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, date) => {
                        const type = showPicker;
                        setShowPicker(null);
                        if (date) {
                            if (type === 'filterFrom') setFilterFromDate(date);
                            else if (type === 'filterTo') setFilterToDate(date);
                        }
                    }}
                />
            )}
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
        color: theme.colors.textPrimary,
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
    userNameText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: theme.colors.primary,
        marginBottom: 4,
    },
    projectName: {
        fontWeight: '600',
        fontSize: 16,
        color: theme.colors.textPrimary,
    },
    status: {
        fontWeight: 'bold',
        textTransform: 'capitalize',
        alignSelf: 'flex-start',
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
    filterContainer: {
        padding: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray200,
    },
    filterTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
        color: theme.colors.textPrimary,
    },
    filterRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    filterDropdown: {
        height: 40,
        borderColor: theme.colors.gray300,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 8,
        backgroundColor: 'white',
    },
    filterDateBtn: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 40,
        borderWidth: 1,
        borderColor: theme.colors.gray300,
        borderRadius: 8,
        paddingHorizontal: 12,
        marginHorizontal: 4,
        backgroundColor: 'white',
    },
    filterDateText: {
        fontSize: 13,
        color: theme.colors.gray800,
    },
    clearFilterBtn: {
        alignSelf: 'flex-end',
        padding: 4,
    },
    clearFilterText: {
        color: theme.colors.primary,
        fontSize: 12,
        fontWeight: '600',
    }
});

export default ManualTimeScreen;
