import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { taskService } from '../../services/taskService';
import { useAppSelector } from '../../store/hooks';

interface AssignTaskModalProps {
    visible: boolean;
    taskId: string;
    onClose: () => void;
    onAssigned: () => void;
}

// TM-025: this was previously a non-functional stub (`visible={false}`
// hardcoded, no props, never rendered anywhere) — there was no way to
// reassign an existing task on mobile at all. This lists the admin's
// subordinates and assigns the selected one via POST task/newtaskuser.
const AssignTaskModal = ({ visible, taskId, onClose, onAssigned }: AssignTaskModalProps) => {
    const { user } = useAppSelector((state) => state.auth);
    const [loading, setLoading] = useState(false);
    const [assigning, setAssigning] = useState(false);
    const [candidates, setCandidates] = useState<any[]>([]);

    useEffect(() => {
        if (!visible || !user?.id) return;
        setLoading(true);
        taskService.getSubordinates(user.id)
            .then((res: any) => {
                const list = Array.isArray(res) ? res : (res?.data || []);
                setCandidates(list);
            })
            .catch(() => setCandidates([]))
            .finally(() => setLoading(false));
    }, [visible, user?.id]);

    const handleAssign = async (candidateId: string) => {
        setAssigning(true);
        try {
            const res = await taskService.assignTask(taskId, candidateId);
            if (res.status === 'success' || res.status === undefined) {
                onAssigned();
            } else {
                Alert.alert('Error', res.message || res?.data?.Error || 'Could not assign this task');
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Could not assign this task');
        } finally {
            setAssigning(false);
        }
    };

    return (
        <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.sheet}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Assign task to</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <ActivityIndicator style={styles.loader} color={theme.colors.primary} />
                    ) : candidates.length === 0 ? (
                        <Text style={styles.emptyText}>No team members available to assign.</Text>
                    ) : (
                        <FlatList
                            data={candidates}
                            keyExtractor={(item) => item._id || item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.row}
                                    disabled={assigning}
                                    onPress={() => handleAssign(item._id || item.id)}
                                >
                                    <Text style={styles.rowText}>
                                        {item.firstName ? `${item.firstName} ${item.lastName || ''}`.trim() : (item.email || 'Unknown')}
                                    </Text>
                                    <Ionicons name="chevron-forward" size={18} color={theme.colors.gray400} />
                                </TouchableOpacity>
                            )}
                        />
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: theme.colors.white, borderTopLeftRadius: theme.borderRadius.lg, borderTopRightRadius: theme.borderRadius.lg, padding: theme.spacing.lg, maxHeight: '70%' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md },
    title: { fontSize: theme.typography.fontSize.lg, fontWeight: 'bold', color: theme.colors.textPrimary },
    loader: { marginVertical: theme.spacing.lg },
    emptyText: { color: theme.colors.gray500, textAlign: 'center', marginVertical: theme.spacing.lg },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.gray100 },
    rowText: { fontSize: theme.typography.fontSize.md, color: theme.colors.textPrimary },
});

export default AssignTaskModal;
