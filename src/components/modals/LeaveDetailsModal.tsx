import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { theme } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import { leaveService } from '../../services/leaveService';

interface LeaveDetailsModalProps {
    visible: boolean;
    onClose: () => void;
    leave: any;
    onActionSuccess: () => void;
    userRole: string;
    currentUserId: string;
}

const LeaveDetailsModal: React.FC<LeaveDetailsModalProps> = ({
    visible,
    onClose,
    leave,
    onActionSuccess,
    userRole,
    currentUserId
}) => {
    const [loading, setLoading] = React.useState(false);

    if (!leave) return null;

    const isPending = leave.status === 'Pending';
    const isOwner = leave.employee?._id === currentUserId || leave.employee === currentUserId;
    const canApproveReject = (userRole === 'Admin' || userRole === 'Manager') && isPending && !isOwner;
    const canDelete = isOwner && isPending;

    const handleAction = async (action: 'Approved' | 'Rejected' | 'Delete') => {
        setLoading(true);
        try {
            if (action === 'Delete') {
                await leaveService.deleteLeaveApplication(leave._id || leave.id);
                Alert.alert("Success", "Leave application deleted.");
            } else {
                await leaveService.updateLeaveApplication(leave._id || leave.id, { status: action });
                Alert.alert("Success", `Leave application ${action.toLowerCase()}.`);
            }
            onActionSuccess();
            onClose();
        } catch (error) {
            console.error(`Failed to ${action} leave`, error);
            Alert.alert("Error", `Failed to ${action} leave. Please try again.`);
        } finally {
            setLoading(false);
        }
    };

    const confirmAction = (action: 'Approved' | 'Rejected' | 'Delete') => {
        Alert.alert(
            "Confirm Action",
            `Are you sure you want to ${action.toLowerCase()} this leave application?`,
            [
                { text: "Cancel", style: "cancel" },
                { text: "Confirm", onPress: () => handleAction(action), style: action === 'Rejected' || action === 'Delete' ? 'destructive' : 'default' }
            ]
        );
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Leave Details</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={theme.colors.gray600} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.scrollContent}>
                        <DetailItem
                            label="Employee"
                            value={leave.employee?.firstName ? `${leave.employee.firstName} ${leave.employee.lastName}` : 'You'}
                            icon="person-outline"
                        />
                        <DetailItem
                            label="Category"
                            value={leave.leaveCategory?.label || 'General'}
                            icon="list-outline"
                        />
                        <DetailItem
                            label="Duration"
                            value={`${leave.calculatedLeaveDays} ${leave.calculatedLeaveDays === 1 ? 'Day' : 'Days'}`}
                            icon="time-outline"
                        />
                        <DetailItem
                            label="From"
                            value={formatDate(leave.startDate)}
                            icon="calendar-outline"
                        />
                        <DetailItem
                            label="To"
                            value={formatDate(leave.endDate)}
                            icon="calendar-outline"
                        />
                        <View style={styles.reasonContainer}>
                            <Text style={styles.reasonLabel}>Reason</Text>
                            <Text style={styles.reasonText}>{leave.reason || 'No reason provided.'}</Text>
                        </View>
                    </ScrollView>

                    <View style={styles.footer}>
                        {loading ? (
                            <ActivityIndicator color={theme.colors.primary} />
                        ) : (
                            <View style={styles.actionButtons}>
                                {canDelete && (
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.deleteButton]}
                                        onPress={() => confirmAction('Delete')}
                                    >
                                        <Text style={styles.actionButtonText}>Delete</Text>
                                    </TouchableOpacity>
                                )}
                                {canApproveReject && (
                                    <>
                                        <TouchableOpacity
                                            style={[styles.actionButton, styles.rejectButton]}
                                            onPress={() => confirmAction('Rejected')}
                                        >
                                            <Text style={styles.actionButtonText}>Reject</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.actionButton, styles.approveButton]}
                                            onPress={() => confirmAction('Approved')}
                                        >
                                            <Text style={styles.actionButtonText}>Approve</Text>
                                        </TouchableOpacity>
                                    </>
                                )}
                                {!canDelete && !canApproveReject && (
                                    <TouchableOpacity style={[styles.actionButton, styles.closeActionButton]} onPress={onClose}>
                                        <Text style={styles.actionButtonText}>Close</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const DetailItem = ({ label, value, icon }: { label: string, value: string, icon: string }) => (
    <View style={styles.detailItem}>
        <View style={styles.iconContainer}>
            <Ionicons name={icon as any} size={20} color={theme.colors.primary} />
        </View>
        <View>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={styles.detailValue}>{value}</Text>
        </View>
    </View>
);

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: theme.colors.white,
        borderTopLeftRadius: theme.borderRadius.xl,
        borderTopRightRadius: theme.borderRadius.xl,
        paddingTop: theme.spacing.md,
        maxHeight: '80%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        paddingBottom: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray200,
    },
    headerTitle: {
        fontSize: theme.typography.fontSize.xl,
        fontWeight: 'bold',
        color: theme.colors.textPrimary,
    },
    closeButton: {
        padding: theme.spacing.xs,
    },
    scrollContent: {
        padding: theme.spacing.lg,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.secondary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.md,
    },
    detailLabel: {
        fontSize: 12,
        color: theme.colors.gray500,
        textTransform: 'uppercase',
    },
    detailValue: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: '600',
        color: theme.colors.textPrimary,
    },
    reasonContainer: {
        backgroundColor: theme.colors.gray50,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        marginBottom: theme.spacing.xl,
    },
    reasonLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: theme.colors.gray600,
        marginBottom: theme.spacing.xs,
    },
    reasonText: {
        fontSize: 14,
        color: theme.colors.textPrimary,
        lineHeight: 20,
    },
    footer: {
        padding: theme.spacing.lg,
        borderTopWidth: 1,
        borderTopColor: theme.colors.gray200,
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: theme.spacing.md,
    },
    actionButton: {
        flex: 1,
        height: 48,
        borderRadius: theme.borderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionButtonText: {
        color: theme.colors.white,
        fontWeight: 'bold',
        fontSize: 16,
    },
    approveButton: {
        backgroundColor: theme.colors.success,
    },
    rejectButton: {
        backgroundColor: theme.colors.error,
    },
    deleteButton: {
        backgroundColor: theme.colors.error,
    },
    closeActionButton: {
        backgroundColor: theme.colors.gray600,
    },
});

export default LeaveDetailsModal;
