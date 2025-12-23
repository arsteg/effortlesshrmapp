import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '../../store/hooks';
import { theme } from '../../theme';
import { manualTimeService } from '../../services/manualTimeService';

const ApprovalScreen = () => {
    const { user } = useAppSelector((state) => state.auth);
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState<'pending' | 'all'>('pending');

    useEffect(() => {
        if (user?.id) {
            loadRequests();
        }
    }, [user?.id]);

    const loadRequests = async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const res = await manualTimeService.getManualTimeRequestsForApprovalByUser(user.id);
            // API returns { data: [...], totalRecords: ... }
            const data = res.data || res || [];
            if (Array.isArray(data)) {
                setRequests(data);
            }
        } catch (error) {
            console.error('Failed to load approval requests', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (item: any, status: 'approved' | 'rejected') => {
        try {
            const payload = {
                requestId: item._id, // or item.id
                user: item.user?._id || item.user?.id || item.user,
                project: item.project?._id || item.project?.id || item.project,
                manager: item.manager?._id || item.manager?.id || item.manager,
                fromDate: item.fromDate,
                toDate: item.toDate,
                task: item.task?._id || item.task?.id || item.task,
                date: item.date,
                status: status
            };

            await manualTimeService.updateManualTimeRequest(payload);
            Alert.alert('Success', `Request ${status} successfully`);
            loadRequests();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to update request');
        }
    };

    const confirmAction = (item: any, status: 'approved' | 'rejected') => {
        Alert.alert(
            `Confirm ${status}`,
            `Are you sure you want to ${status} this request?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: status === 'approved' ? 'Approve' : 'Reject',
                    style: status === 'rejected' ? 'destructive' : 'default',
                    onPress: () => handleAction(item, status)
                }
            ]
        );
    };

    const filteredRequests = requests.filter(r => {
        if (filter === 'pending') return r.status === 'pending';
        return true;
    });

    const renderItem = ({ item }: { item: any }) => {
        const userName = item.user ? `${item.user.firstName} ${item.user.lastName || ''}` : 'Unknown User';
        const projectName = item.project?.projectName || 'Unknown Project';
        const taskName = item.task?.taskName || item.task?.name || 'Unknown Task';

        return (
            <View style={styles.card}>
                <View style={styles.header}>
                    <Text style={styles.userName}>{userName}</Text>
                    <View style={[styles.statusBadge, {
                        backgroundColor: item.status === 'approved' ? '#e6fffa' : item.status === 'rejected' ? '#fff5f5' : '#fffaf0'
                    }]}>
                        <Text style={[styles.statusText, {
                            color: item.status === 'approved' ? 'green' : item.status === 'rejected' ? 'red' : 'orange'
                        }]}>
                            {item.status}
                        </Text>
                    </View>
                </View>

                <Text style={styles.projectText}>{projectName} - {taskName}</Text>
                <Text style={styles.dateText}>
                    {new Date(item.fromDate).toLocaleString()} - {new Date(item.toDate).toLocaleString()}
                </Text>
                <Text style={styles.reasonText}>"{item.reason}"</Text>

                {item.status === 'pending' && (
                    <View style={styles.actionRow}>
                        <TouchableOpacity
                            style={[styles.btn, styles.rejectBtn]}
                            onPress={() => confirmAction(item, 'rejected')}
                        >
                            <Text style={styles.btnText}>Reject</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.btn, styles.approveBtn]}
                            onPress={() => confirmAction(item, 'approved')}
                        >
                            <Text style={styles.btnText}>Approve</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <Text style={styles.screenTitle}>Approvals</Text>
                <TouchableOpacity onPress={loadRequests}>
                    <Ionicons name="refresh" size={24} color={theme.colors.primary} />
                </TouchableOpacity>
            </View>

            <View style={styles.filterRow}>
                <TouchableOpacity
                    style={[styles.filterBtn, filter === 'pending' && styles.activeFilter]}
                    onPress={() => setFilter('pending')}
                >
                    <Text style={[styles.filterText, filter === 'pending' && styles.activeFilterText]}>Pending</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterBtn, filter === 'all' && styles.activeFilter]}
                    onPress={() => setFilter('all')}
                >
                    <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>All History</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
            ) : (
                <FlatList
                    data={filteredRequests}
                    renderItem={renderItem}
                    keyExtractor={(item, index) => item._id || item.id || index.toString()}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.emptyText}>No approval requests found.</Text>}
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
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray200,
    },
    screenTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    filterRow: {
        flexDirection: 'row',
        padding: 10,
        backgroundColor: 'white',
        marginBottom: 1,
    },
    filterBtn: {
        paddingVertical: 6,
        paddingHorizontal: 16,
        borderRadius: 20,
        marginRight: 10,
        backgroundColor: theme.colors.gray100,
    },
    activeFilter: {
        backgroundColor: theme.colors.primary,
    },
    filterText: {
        color: theme.colors.gray600,
        fontSize: 14,
        fontWeight: '600',
    },
    activeFilterText: {
        color: 'white',
    },
    loader: {
        marginTop: 20,
    },
    list: {
        padding: 16,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        ...theme.shadows.small,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    userName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'capitalize',
    },
    projectText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.gray800,
        marginBottom: 4,
    },
    dateText: {
        fontSize: 12,
        color: theme.colors.gray600,
        marginBottom: 8,
    },
    reasonText: {
        fontSize: 14,
        fontStyle: 'italic',
        color: theme.colors.gray600,
        marginBottom: 12,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        borderTopWidth: 1,
        borderTopColor: theme.colors.gray100,
        paddingTop: 12,
    },
    btn: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 6,
        marginLeft: 10,
    },
    rejectBtn: {
        backgroundColor: '#fff5f5',
        borderWidth: 1,
        borderColor: 'red',
    },
    approveBtn: {
        backgroundColor: theme.colors.primary,
    },
    btnText: {
        fontSize: 14,
        fontWeight: '600',
        color: 'black', // for reject
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 20,
        color: theme.colors.gray500,
    },
});

// Update styles for buttons specifically
const additionalStyles = StyleSheet.create({
    rejectText: {
        color: 'red',
    },
    approveText: {
        color: 'white',
    }
});

// Merging manual hack for correct text colors
styles.rejectBtn = { ...styles.rejectBtn };
styles.approveBtn = { ...styles.approveBtn };
// Actually simpler to just inline in render

export default ApprovalScreen;
