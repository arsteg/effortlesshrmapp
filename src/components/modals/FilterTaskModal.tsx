import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { Button } from '../common/Button';
import { TASK_STATUSES, TASK_PRIORITIES, TaskStatus, TaskPriority } from '../../utils/constants';

export interface TaskFilters {
    statuses: TaskStatus[];
    priorities: TaskPriority[];
}

interface FilterTaskModalProps {
    visible: boolean;
    value: TaskFilters;
    onClose: () => void;
    onApply: (filters: TaskFilters) => void;
}

const EMPTY_FILTERS: TaskFilters = { statuses: [], priorities: [] };

// TM-025: this was previously a non-functional stub (`visible={false}`
// hardcoded, no props) — mobile had no way to filter the task list at all
// beyond the admin "viewing tasks for" member switch. Filters are applied
// client-side over the already-fetched page, matching the scope of the
// mobile task list fix (server-side filtering for web is tracked separately
// as TM-019).
const FilterTaskModal = ({ visible, value, onClose, onApply }: FilterTaskModalProps) => {
    const [draft, setDraft] = useState<TaskFilters>(value || EMPTY_FILTERS);

    useEffect(() => {
        if (visible) setDraft(value || EMPTY_FILTERS);
    }, [visible, value]);

    const toggle = (list: string[], item: string) =>
        list.includes(item) ? list.filter((i) => i !== item) : [...list, item];

    return (
        <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.sheet}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Filter tasks</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView>
                        <Text style={styles.sectionLabel}>Status</Text>
                        <View style={styles.chipRow}>
                            {TASK_STATUSES.map((status) => {
                                const active = draft.statuses.includes(status);
                                return (
                                    <TouchableOpacity
                                        key={status}
                                        style={[styles.chip, active && styles.chipActive]}
                                        onPress={() => setDraft({ ...draft, statuses: toggle(draft.statuses, status) as TaskStatus[] })}
                                    >
                                        <Text style={[styles.chipText, active && styles.chipTextActive]}>{status}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <Text style={styles.sectionLabel}>Priority</Text>
                        <View style={styles.chipRow}>
                            {TASK_PRIORITIES.map((priority) => {
                                const active = draft.priorities.includes(priority);
                                return (
                                    <TouchableOpacity
                                        key={priority}
                                        style={[styles.chip, active && styles.chipActive]}
                                        onPress={() => setDraft({ ...draft, priorities: toggle(draft.priorities, priority) as TaskPriority[] })}
                                    >
                                        <Text style={[styles.chipText, active && styles.chipTextActive]}>{priority}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </ScrollView>

                    <View style={styles.footer}>
                        <Button title="Clear" variant="outline" onPress={() => setDraft(EMPTY_FILTERS)} style={styles.footerButton} />
                        <Button title="Apply" onPress={() => onApply(draft)} style={styles.footerButton} />
                    </View>
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
    sectionLabel: { fontSize: theme.typography.fontSize.sm, fontWeight: '600', color: theme.colors.textSecondary, marginBottom: theme.spacing.sm, marginTop: theme.spacing.sm },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: theme.spacing.sm },
    chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: theme.borderRadius.round, borderWidth: 1, borderColor: theme.colors.gray300 },
    chipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    chipText: { color: theme.colors.textPrimary, fontSize: 13 },
    chipTextActive: { color: theme.colors.white },
    footer: { flexDirection: 'row', gap: 8, marginTop: theme.spacing.md },
    footerButton: { flex: 1 },
});

export default FilterTaskModal;
