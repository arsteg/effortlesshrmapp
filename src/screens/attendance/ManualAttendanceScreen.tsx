import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Image,
    SafeAreaView,
    RefreshControl,
    TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '../../store/hooks';
import { theme } from '../../theme';
import { attendanceService } from '../../services/attendanceService';
import { userService } from '../../services/userService';
import { Dropdown } from 'react-native-element-dropdown';

import { useNavigation } from '@react-navigation/native';

const ManualAttendanceScreen = () => {
    const navigation = useNavigation<any>();
    const isAdminPortal = useAppSelector((state) => state.auth.isAdminPortal);
    const [requests, setRequests] = useState<any[]>([]);
    const [subordinates, setSubordinates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<'pending' | 'all'>('pending');
    const [fromDate, setFromDate] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
    });
    const [toDate, setToDate] = useState(() => {
        const d = new Date();
        return d.toISOString().split('T')[0];
    });
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const user = useAppSelector((state) => state.auth.user);

    const loadSubordinates = useCallback(async () => {
        if (!user?.id) return;
        try {
            const response = await userService.getSubordinates(user.id);
            if (response.status?.toLowerCase() === 'success') {
                setSubordinates(response.data || []);
            }
        } catch (error) {
            console.error('Failed to load subordinates:', error);
        }
    }, [user?.id]);

    const loadRequests = useCallback(async () => {
        try {
            setLoading(true);
            const response = await attendanceService.getManualAttendanceRequests({
                status: filter === 'pending' ? 'pending' : undefined,
                fromDate: fromDate || undefined,
                toDate: toDate || undefined,
                user: selectedUser || undefined
            });
            if (response.status?.toLowerCase() === 'success') {
                setRequests(response.data.requests || []);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to load manual attendance requests');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [filter, fromDate, toDate, selectedUser]);

    useEffect(() => {
        if (isAdminPortal) {
            loadSubordinates();
        }
    }, [isAdminPortal, loadSubordinates]);

    useEffect(() => {
        loadRequests();
    }, [loadRequests]);

    const handleAction = async (requestId: string, status: 'approved' | 'rejected') => {
        try {
            const response: any = await attendanceService.approveManualAttendance({ requestId, status });
            if (response.status?.toLowerCase() === 'success') {
                Alert.alert('Success', `Request ${status} successfully`);
                loadRequests();
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to update request');
        }
    };

    const confirmAction = (requestId: string, status: 'approved' | 'rejected') => {
        Alert.alert(
            `Confirm ${status}`,
            `Are you sure you want to ${status} this request?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: status === 'approved' ? 'Approve' : 'Reject',
                    style: status === 'rejected' ? 'destructive' : 'default',
                    onPress: () => handleAction(requestId, status)
                }
            ]
        );
    };

    const renderItem = ({ item }: { item: any }) => {
        const userName = item.user ? `${item.user.firstName} ${item.user.lastName || ''}` : 'Unknown User';
        const dateStr = new Date(item.date).toLocaleDateString();

        return (
            <View style={styles.card}>
                <View style={styles.header}>
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>{userName}</Text>
                        <Text style={styles.dateText}>{dateStr}</Text>
                    </View>
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

                <Text style={styles.reasonText}>Reason: {item.reason}</Text>

                <Text style={styles.reasonText}>Reason: {item.reason}</Text>

                {item.photoUrl && (
                    <Image source={{ uri: item.photoUrl }} style={styles.requestImage} resizeMode="cover" />
                )}

                {isAdminPortal && item.status === 'pending' && (
                    <View style={styles.actionRow}>
                        <TouchableOpacity
                            style={[styles.btn, styles.rejectBtn]}
                            onPress={() => confirmAction(item._id, 'rejected')}
                        >
                            <Text style={styles.rejectText}>Reject</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.btn, styles.approveBtn]}
                            onPress={() => confirmAction(item._id, 'approved')}
                        >
                            <Text style={styles.approveText}>Approve</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#fff' }}>
                <TouchableOpacity
                    onPress={() => navigation.navigate('Attendance')}
                    style={{ marginRight: 15 }}
                >
                    <Ionicons name="arrow-back" size={24} color={theme.colors.gray900} />
                </TouchableOpacity>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.colors.gray900 }}>Attendance Requests</Text>
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
                    <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>All Requests</Text>
                </TouchableOpacity>
            </View>

            {isAdminPortal && (
                <View style={styles.adminFilterBox}>
                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                            <Text style={styles.filterLabel}>From Date</Text>
                            <TextInput
                                style={styles.filterInput}
                                value={fromDate}
                                placeholder="YYYY-MM-DD"
                                placeholderTextColor="#999"
                                onChangeText={setFromDate}
                            />
                        </View>
                        <View style={{ flex: 1, marginLeft: 8 }}>
                            <Text style={styles.filterLabel}>To Date</Text>
                            <TextInput
                                style={styles.filterInput}
                                value={toDate}
                                placeholder="YYYY-MM-DD"
                                placeholderTextColor="#999"
                                onChangeText={setToDate}
                            />
                        </View>
                    </View>

                    <Text style={[styles.filterLabel, { marginTop: 12 }]}>Subordinate</Text>
                    <Dropdown
                        style={styles.dropdown}
                        placeholderStyle={styles.placeholderStyle}
                        selectedTextStyle={styles.selectedTextStyle}
                        data={subordinates}
                        labelField="firstName"
                        valueField="_id"
                        placeholder="All Subordinates"
                        value={selectedUser}
                        onChange={(item) => setSelectedUser(item._id)}
                        renderLeftIcon={() => (
                            <Ionicons style={{ marginRight: 8 }} color="#666" name="person-outline" size={20} />
                        )}
                    />

                    {(fromDate !== `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01` ||
                        toDate !== new Date().toISOString().split('T')[0] ||
                        selectedUser) && (
                            <TouchableOpacity
                                style={styles.clearFilters}
                                onPress={() => {
                                    const d = new Date();
                                    setFromDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`);
                                    setToDate(d.toISOString().split('T')[0]);
                                    setSelectedUser(null);
                                }}
                            >
                                <Text style={styles.clearFiltersText}>Clear Filters</Text>
                            </TouchableOpacity>
                        )}
                </View>
            )}

            {loading && !refreshing ? (
                <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
            ) : (
                <FlatList
                    data={requests}
                    renderItem={renderItem}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadRequests(); }} colors={[theme.colors.primary]} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="document-text-outline" size={48} color={theme.colors.gray300} />
                            <Text style={styles.emptyText}>No requests found.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.gray50 },
    filterRow: { flexDirection: 'row', padding: 15, backgroundColor: '#fff' },
    filterBtn: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20, marginRight: 10, backgroundColor: theme.colors.gray100 },
    activeFilter: { backgroundColor: theme.colors.primary },
    filterText: { color: theme.colors.gray600, fontWeight: '600' },
    activeFilterText: { color: '#fff' },
    loader: { marginTop: 40 },
    list: { padding: 15 },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 15, ...theme.shadows.small },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    userInfo: { flex: 1 },
    userName: { fontSize: 16, fontWeight: 'bold', color: theme.colors.gray900 },
    dateText: { fontSize: 12, color: theme.colors.gray500, marginTop: 2 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    statusText: { fontSize: 12, fontWeight: 'bold', textTransform: 'capitalize' },
    reasonText: { fontSize: 14, color: theme.colors.gray700, marginBottom: 12, lineHeight: 20 },
    requestImage: { width: '100%', height: 150, borderRadius: 8, marginBottom: 12 },
    actionRow: { flexDirection: 'row', justifyContent: 'flex-end', borderTopWidth: 1, borderTopColor: theme.colors.gray100, paddingTop: 12 },
    btn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, marginLeft: 10, minWidth: 100, alignItems: 'center' },
    rejectBtn: { backgroundColor: '#fff5f5', borderWidth: 1, borderColor: theme.colors.error },
    approveBtn: { backgroundColor: theme.colors.primary },
    rejectText: { color: theme.colors.error, fontWeight: 'bold' },
    approveText: { color: '#fff', fontWeight: 'bold' },
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { marginTop: 10, color: theme.colors.gray500, fontSize: 16 },
    adminFilterBox: { padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: theme.colors.gray100 },
    row: { flexDirection: 'row', alignItems: 'center' },
    filterLabel: { fontSize: 12, fontWeight: 'bold', color: theme.colors.gray600, marginBottom: 4 },
    filterInput: { height: 40, borderBottomWidth: 1, borderBottomColor: theme.colors.gray300, fontSize: 14, color: theme.colors.gray900 },
    dropdown: { height: 40, borderBottomWidth: 1, borderBottomColor: theme.colors.gray300 },
    placeholderStyle: { fontSize: 14, color: '#999' },
    selectedTextStyle: { fontSize: 14, color: theme.colors.gray900 },
    clearFilters: { marginTop: 10, alignSelf: 'flex-end' },
    clearFiltersText: { color: theme.colors.primary, fontSize: 12, fontWeight: 'bold' }
});

export default ManualAttendanceScreen;
