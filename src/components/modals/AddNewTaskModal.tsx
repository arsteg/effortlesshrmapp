import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    Platform,
    KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { theme } from '../../theme';
import { taskService, AddTaskRequest } from '../../services/taskService';
import { useAppSelector } from '../../store/hooks';

interface AddNewTaskModalProps {
    isVisible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    isAdmin: boolean;
}

const AddNewTaskModal = ({ isVisible, onClose, onSuccess, isAdmin }: AddNewTaskModalProps) => {
    const { user } = useAppSelector((state) => state.auth);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [projects, setProjects] = useState<any[]>([]);
    const [subordinates, setSubordinates] = useState<any[]>([]);

    const [form, setForm] = useState<AddTaskRequest>({
        taskName: '',
        description: '',
        project: '',
        priority: 'Medium',
        status: 'To Do',
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        user: '', // Assignee
    });

    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    useEffect(() => {
        if (isVisible) {
            loadInitialData();
        }
    }, [isVisible]);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const projectsRes = isAdmin
                ? await taskService.getProjects()
                : await taskService.getProjectsByUser(user?.id || '');

            setProjects(projectsRes.data?.projectList || projectsRes.data || []);

            if (isAdmin) {
                const subordinatesRes = await taskService.getSubordinates(user?.id || '');
                setSubordinates(subordinatesRes.data || []);
            }
        } catch (error) {
            console.error('Failed to load initial data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!form.taskName || !form.project || !form.priority) {
            Alert.alert('Validation Error', 'Please fill in all mandatory fields (Task Name, Project, Priority)');
            return;
        }

        setSaving(true);
        try {
            await taskService.addTask({
                ...form,
                user: isAdmin ? form.user : user?.id,
            });
            Alert.alert('Success', 'Task created successfully');
            onSuccess();
            onClose();
            // Reset form
            setForm({
                taskName: '',
                description: '',
                project: '',
                priority: 'Medium',
                status: 'To Do',
                startDate: new Date().toISOString(),
                endDate: new Date().toISOString(),
                user: '',
            });
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to create task');
        } finally {
            setSaving(false);
        }
    };

    const onDateChange = (event: any, selectedDate?: Date, type: 'start' | 'end' = 'start') => {
        if (type === 'start') {
            setShowStartPicker(Platform.OS === 'ios');
            if (selectedDate) setForm({ ...form, startDate: selectedDate.toISOString() });
        } else {
            setShowEndPicker(Platform.OS === 'ios');
            if (selectedDate) setForm({ ...form, endDate: selectedDate.toISOString() });
        }
    };

    return (
        <Modal animationType="slide" transparent={true} visible={isVisible} onRequestClose={onClose}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.centeredView}
            >
                <View style={styles.modalView}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Add New Task</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Task Name *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter task name"
                                value={form.taskName}
                                onChangeText={(text) => setForm({ ...form, taskName: text })}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Project *</Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={form.project}
                                    onValueChange={(val) => setForm({ ...form, project: val })}
                                >
                                    <Picker.Item label="Select Project" value="" />
                                    {projects.map((p) => (
                                        <Picker.Item key={p._id || p.id} label={p.projectName} value={p._id || p.id} />
                                    ))}
                                </Picker>
                            </View>
                        </View>

                        {isAdmin && (
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Assign To</Text>
                                <View style={styles.pickerContainer}>
                                    <Picker
                                        selectedValue={form.user}
                                        onValueChange={(val) => setForm({ ...form, user: val })}
                                    >
                                        <Picker.Item label="Select Assignee" value="" />
                                        {subordinates.map((s) => (
                                            <Picker.Item key={s._id || s.id} label={s.firstName + ' ' + s.lastName} value={s._id || s.id} />
                                        ))}
                                    </Picker>
                                </View>
                            </View>
                        )}

                        <View style={styles.row}>
                            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                                <Text style={styles.label}>Priority *</Text>
                                <View style={styles.pickerContainer}>
                                    <Picker
                                        selectedValue={form.priority}
                                        onValueChange={(val) => setForm({ ...form, priority: val })}
                                    >
                                        <Picker.Item label="Low" value="Low" />
                                        <Picker.Item label="Medium" value="Medium" />
                                        <Picker.Item label="High" value="High" />
                                        <Picker.Item label="Critical" value="Critical" />
                                    </Picker>
                                </View>
                            </View>
                            <View style={[styles.formGroup, { flex: 1 }]}>
                                <Text style={styles.label}>Status</Text>
                                <View style={styles.pickerContainer}>
                                    <Picker
                                        selectedValue={form.status}
                                        onValueChange={(val) => setForm({ ...form, status: val })}
                                    >
                                        <Picker.Item label="To Do" value="To Do" />
                                        <Picker.Item label="In Progress" value="In Progress" />
                                        <Picker.Item label="Done" value="Done" />
                                    </Picker>
                                </View>
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                                <Text style={styles.label}>Start Date</Text>
                                <TouchableOpacity onPress={() => setShowStartPicker(true)} style={styles.dateInput}>
                                    <Text>{new Date(form.startDate).toLocaleDateString()}</Text>
                                    <Ionicons name="calendar-outline" size={20} color={theme.colors.gray500} />
                                </TouchableOpacity>
                                {showStartPicker && (
                                    <DateTimePicker
                                        value={new Date(form.startDate)}
                                        mode="date"
                                        display="default"
                                        onChange={(e, d) => onDateChange(e, d, 'start')}
                                    />
                                )}
                            </View>
                            <View style={[styles.formGroup, { flex: 1 }]}>
                                <Text style={styles.label}>End Date</Text>
                                <TouchableOpacity onPress={() => setShowEndPicker(true)} style={styles.dateInput}>
                                    <Text>{new Date(form.endDate).toLocaleDateString()}</Text>
                                    <Ionicons name="calendar-outline" size={20} color={theme.colors.gray500} />
                                </TouchableOpacity>
                                {showEndPicker && (
                                    <DateTimePicker
                                        value={new Date(form.endDate)}
                                        mode="date"
                                        display="default"
                                        onChange={(e, d) => onDateChange(e, d, 'end')}
                                    />
                                )}
                            </View>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Description</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Enter task description"
                                multiline
                                numberOfLines={4}
                                value={form.description}
                                onChangeText={(text) => setForm({ ...form, description: text })}
                            />
                        </View>
                    </ScrollView>

                    <View style={styles.modalFooter}>
                        <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, styles.saveButton, saving && styles.disabledButton]}
                            onPress={handleSave}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator color={theme.colors.white} />
                            ) : (
                                <Text style={styles.saveButtonText}>Save Task</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalView: {
        backgroundColor: theme.colors.white,
        borderTopLeftRadius: theme.borderRadius.lg,
        borderTopRightRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
        maxHeight: '90%',
        ...theme.shadows.medium,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
        paddingBottom: theme.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray200,
    },
    modalTitle: {
        fontSize: theme.typography.fontSize.xl,
        fontWeight: 'bold',
        color: theme.colors.textPrimary,
    },
    modalContent: {
        marginBottom: theme.spacing.md,
    },
    formGroup: {
        marginBottom: theme.spacing.md,
    },
    label: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: '600',
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.xs,
    },
    input: {
        backgroundColor: theme.colors.gray100,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.textPrimary,
        borderWidth: 1,
        borderColor: theme.colors.gray200,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    pickerContainer: {
        backgroundColor: theme.colors.gray100,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.gray200,
        overflow: 'hidden',
    },
    dateInput: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: theme.colors.gray100,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.gray200,
    },
    row: {
        flexDirection: 'row',
    },
    modalFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: theme.colors.gray200,
    },
    button: {
        flex: 1,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        backgroundColor: theme.colors.gray200,
        marginRight: theme.spacing.sm,
    },
    saveButton: {
        backgroundColor: theme.colors.primary,
    },
    disabledButton: {
        opacity: 0.6,
    },
    cancelButtonText: {
        color: theme.colors.textPrimary,
        fontWeight: 'bold',
    },
    saveButtonText: {
        color: theme.colors.white,
        fontWeight: 'bold',
    },
});

export default AddNewTaskModal;
