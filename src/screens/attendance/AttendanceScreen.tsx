import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Alert,
    FlatList,
    SafeAreaView,
    RefreshControl,
    Modal,
    TextInput,
    ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAppSelector } from '../../store/hooks';
import { Dropdown } from 'react-native-element-dropdown';
import { useLocation } from '../../hooks/useLocation';
import { useCamera } from '../../hooks/useCamera';
import { attendanceService } from '../../services/attendanceService';
import { theme } from '../../theme';
import { calculateDistance } from '../../utils/distance';

interface Office {
    _id: string;
    name: string;
    location: {
        type: string;
        coordinates: number[]; // [lng, lat]
    };
    radius: number;
}

interface AttendanceLog {
    _id: string;
    type: 'check_in' | 'check_out';
    timestamp: string;
    status: string;
    anomaly?: {
        type: string;
        isResolved: boolean;
    };
}

const AttendanceScreen = () => {
    const { location, loading: locationLoading, getCurrentLocation } = useLocation();
    const { takeSelfie } = useCamera();

    const navigation = useNavigation<any>();
    const isAdminPortal = useAppSelector((state) => state.auth.isAdminPortal);

    const [offices, setOffices] = useState<Office[]>([]);
    const [selectedOffice, setSelectedOffice] = useState<Office | null>(null);
    const [distance, setDistance] = useState<number | null>(null);
    const [history, setHistory] = useState<AttendanceLog[]>([]);
    const [status, setStatus] = useState<AttendanceLog | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Manual Request Modal State
    const [manualModalVisible, setManualModalVisible] = useState(false);
    const [manualForm, setManualForm] = useState({
        date: new Date().toISOString().split('T')[0],
        reason: '',
        photoUrl: ''
    });

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [officesRes, historyRes]: [any, any] = await Promise.all([
                attendanceService.getOffices(),
                attendanceService.getHistory()
            ]);

            if (officesRes.status?.toLowerCase() === 'success') {
                setOffices(officesRes.data?.offices || []);
                if (officesRes.data?.offices?.length > 0) {
                    setSelectedOffice(officesRes.data.offices[0]);
                }
            }

            if (historyRes.status?.toLowerCase() === 'success') {
                const historyData = historyRes.data?.history || [];
                setHistory(historyData);
                // Last check-in/out determines current state
                const last = historyData[0];
                setStatus(last || null);
            }
        } catch (error) {
            console.error('Error loading attendance data:', error);
            Alert.alert('Error', 'Failed to load attendance data.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        if (location && selectedOffice) {
            const dist = calculateDistance(
                location.coords.latitude,
                location.coords.longitude,
                selectedOffice.location.coordinates[1],
                selectedOffice.location.coordinates[0]
            );
            setDistance(dist);
        }
    }, [location, selectedOffice]);

    const handleRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const handleCheckIn = async () => {
        if (!selectedOffice) {
            Alert.alert('Office Required', 'Please select an office location.');
            return;
        }

        setActionLoading(true);
        try {
            const loc = await getCurrentLocation();
            if (!loc) {
                setActionLoading(false);
                return;
            }

            // Client-side geofence check for UX
            const dist = calculateDistance(
                loc.coords.latitude,
                loc.coords.longitude,
                selectedOffice.location.coordinates[1],
                selectedOffice.location.coordinates[0]
            );

            if (dist > selectedOffice.radius) {
                Alert.alert(
                    'Outside Geofence',
                    `You are ${Math.round(dist)}m away from ${selectedOffice.name}. The allowed radius is ${selectedOffice.radius}m.`
                );
                setActionLoading(false);
                return;
            }

            // Selfie mandatory for check-in
            const img = await takeSelfie();
            if (!img) {
                Alert.alert('Selfie Required', 'Verification depends on a selfie capture.');
                setActionLoading(false);
                return;
            }

            const response: any = await attendanceService.clockIn({
                officeId: selectedOffice._id,
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
                selfieUrl: img,
                deviceId: 'Mobile-App'
            });

            if (response.status?.toLowerCase() === 'success') {
                Alert.alert('Success', 'Clocked in successfully.');
                loadData();
            } else {
                Alert.alert('Failed', response.message || 'Check-in failed.');
            }
        } catch (error) {
            Alert.alert('Error', 'An unexpected error occurred during check-in.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCheckOut = async () => {
        setActionLoading(true);
        try {
            const loc = await getCurrentLocation();
            if (!loc) {
                setActionLoading(false);
                return;
            }

            const response: any = await attendanceService.clockOut({
                officeId: selectedOffice?._id,
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude
            });

            if (response.status?.toLowerCase() === 'success') {
                Alert.alert('Success', 'Clocked out successfully.');
                loadData();
            } else {
                Alert.alert('Failed', response.message || 'Check-out failed.');
            }
        } catch (error) {
            Alert.alert('Error', 'An unexpected error occurred during check-out.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleManualRequest = async () => {
        if (!manualForm.reason) {
            Alert.alert('Error', 'Please provide a reason for the manual request.');
            return;
        }

        setActionLoading(true);
        try {
            const response: any = await attendanceService.requestManualAttendance(manualForm);
            if (response.status?.toLowerCase() === 'success') {
                Alert.alert('Success', 'Manual attendance request submitted.');
                setManualModalVisible(false);
                setManualForm({ ...manualForm, reason: '' });
                loadData();
            } else {
                Alert.alert('Failed', response.message || 'Request failed.');
            }
        } catch (error) {
            Alert.alert('Error', 'An unexpected error occurred.');
        } finally {
            setActionLoading(false);
        }
    };

    const renderHistoryItem = ({ item }: { item: AttendanceLog }) => (
        <View style={styles.historyItem}>
            <View style={[styles.historyIcon, { backgroundColor: item.type === 'check_in' || item.type === 'check-in' ? '#e7f9ee' : '#feeeee' }]}>
                <Ionicons
                    name={item.type === 'check_in' || item.type === 'check-in' ? 'arrow-down-circle' : 'arrow-up-circle'}
                    size={24}
                    color={item.type === 'check_in' || item.type === 'check-in' ? theme.colors.success : theme.colors.error}
                />
            </View>
            <View style={styles.historyInfo}>
                <Text style={styles.historyType}>
                    {item.type === 'check_in' || item.type === 'check-in' ? 'Clocked In' : 'Clocked Out'}
                </Text>
                <Text style={styles.historyTime}>
                    {new Date(item.timestamp).toLocaleString()}
                </Text>
            </View>
            <View style={styles.historyStatus}>
                <Text style={[styles.statusBadge, { color: item.anomaly ? theme.colors.error : theme.colors.success }]}>
                    {item.anomaly ? 'Anomaly' : 'Verified'}
                </Text>
            </View>
        </View>
    );

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    const isClockedIn = status?.type === 'check_in' || status?.type === 'check-in';

    const renderUserPortal = () => (
        <FlatList
            data={history}
            keyExtractor={(item) => item._id}
            renderItem={renderHistoryItem}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[theme.colors.primary]} />
            }
            ListHeaderComponent={
                <View style={styles.header}>
                    <View style={styles.statusCard}>
                        <View style={[styles.statusIndicator, { backgroundColor: isClockedIn ? theme.colors.success : theme.colors.error }]} />
                        <View>
                            <Text style={styles.statusLabel}>Current Status</Text>
                            <Text style={styles.statusValue}>{isClockedIn ? 'Clocked In' : 'Clocked Out'}</Text>
                            {status && (
                                <Text style={styles.statusTime}>Since {new Date(status.timestamp).toLocaleTimeString()}</Text>
                            )}
                        </View>
                    </View>

                    <Text style={styles.sectionTitle}>Select Office</Text>
                    <Dropdown
                        style={styles.dropdown}
                        placeholderStyle={styles.placeholderStyle}
                        selectedTextStyle={styles.selectedTextStyle}
                        data={offices}
                        labelField="name"
                        valueField="_id"
                        placeholder="Select Office"
                        value={selectedOffice?._id}
                        onChange={(item) => setSelectedOffice(item)}
                        renderLeftIcon={() => (
                            <Ionicons style={styles.icon} color={theme.colors.gray600} name="business-outline" size={20} />
                        )}
                    />

                    {selectedOffice && distance !== null && (
                        <View style={styles.geofenceInfo}>
                            <Ionicons name="location-outline" size={16} color={theme.colors.primary} />
                            <Text style={styles.distanceText}>
                                Distance: <Text style={styles.bold}>{Math.round(distance)}m</Text> (Target: {selectedOffice.radius}m)
                            </Text>
                        </View>
                    )}

                    <View style={styles.actionContainer}>
                        {!isClockedIn ? (
                            <TouchableOpacity
                                style={[styles.button, styles.checkInButton, actionLoading && styles.disabledButton]}
                                onPress={handleCheckIn}
                                disabled={actionLoading}
                            >
                                {actionLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <Ionicons name="log-in-outline" size={24} color="#fff" style={{ marginRight: 8 }} />
                                        <Text style={styles.buttonText}>Clock In</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={[styles.button, styles.checkOutButton, actionLoading && styles.disabledButton]}
                                onPress={handleCheckOut}
                                disabled={actionLoading}
                            >
                                {actionLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <Ionicons name="log-out-outline" size={24} color="#fff" style={{ marginRight: 8 }} />
                                        <Text style={styles.buttonText}>Clock Out</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.secondaryActions}>
                        <TouchableOpacity
                            style={[styles.secondaryButton, { backgroundColor: theme.colors.gray100 }]}
                            onPress={() => setManualModalVisible(true)}
                        >
                            <Ionicons name="document-text-outline" size={20} color={theme.colors.gray700} />
                            <Text style={styles.secondaryButtonText}>Manual Request</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.secondaryButton, { backgroundColor: theme.colors.gray100 }]}
                            onPress={() => navigation.navigate('Attendance Requests')}
                        >
                            <Ionicons name="list-outline" size={20} color={theme.colors.gray700} />
                            <Text style={styles.secondaryButtonText}>View Requests</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.sectionTitle}>Recent Activity</Text>
                </View>
            }
            ListEmptyComponent={
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No attendance records found.</Text>
                </View>
            }
            contentContainerStyle={styles.listContent}
        />
    );

    const renderAdminPortal = () => (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        >
            <View style={styles.header}>
                <Text style={styles.adminHubTitle}>Attendance Management</Text>
                <Text style={styles.adminHubSubtitle}>Configure offices and manage employee requests</Text>

                <TouchableOpacity
                    style={styles.adminCard}
                    onPress={() => navigation.navigate('Office Settings')}
                >
                    <View style={[styles.adminCardIcon, { backgroundColor: '#eef2ff' }]}>
                        <Ionicons name="business" size={32} color={theme.colors.primary} />
                    </View>
                    <View style={styles.adminCardContent}>
                        <Text style={styles.adminCardTitle}>Office Management</Text>
                        <Text style={styles.adminCardDesc}>Add/Edit offices and set geofence rules</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color={theme.colors.gray400} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.adminCard}
                    onPress={() => navigation.navigate('Attendance Requests')}
                >
                    <View style={[styles.adminCardIcon, { backgroundColor: '#fdf2f2' }]}>
                        <Ionicons name="document-text" size={32} color={theme.colors.error} />
                    </View>
                    <View style={styles.adminCardContent}>
                        <Text style={styles.adminCardTitle}>Attendance Requests</Text>
                        <Text style={styles.adminCardDesc}>Review and approve manual attendance</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color={theme.colors.gray400} />
                </TouchableOpacity>
            </View>
        </ScrollView>
    );

    return (
        <SafeAreaView style={styles.container}>
            {isAdminPortal ? renderAdminPortal() : renderUserPortal()}

            {/* Manual Request Modal */}
            <Modal visible={manualModalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Manual Attendance Request</Text>
                        <ScrollView>
                            <Text style={styles.label}>Date</Text>
                            <TextInput
                                style={styles.input}
                                value={manualForm.date}
                                placeholder="YYYY-MM-DD"
                                onChangeText={(text) => setManualForm({ ...manualForm, date: text })}
                            />

                            <Text style={styles.label}>Reason</Text>
                            <TextInput
                                style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                                multiline
                                numberOfLines={4}
                                placeholder="e.g., Forgot to clock in, Device issue, etc."
                                value={manualForm.reason}
                                onChangeText={(text) => setManualForm({ ...manualForm, reason: text })}
                            />

                            <TouchableOpacity
                                style={styles.photoButton}
                                onPress={async () => {
                                    const img = await takeSelfie();
                                    if (img) setManualForm({ ...manualForm, photoUrl: img });
                                }}
                            >
                                <Ionicons name="camera" size={24} color={theme.colors.primary} />
                                <Text style={styles.photoButtonText}>
                                    {manualForm.photoUrl ? 'Photo Attached' : 'Attach Photo'}
                                </Text>
                            </TouchableOpacity>
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={styles.cancelButton} onPress={() => setManualModalVisible(false)}>
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.saveButton, actionLoading && { opacity: 0.7 }]}
                                onPress={handleManualRequest}
                                disabled={actionLoading}
                            >
                                {actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Submit</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.gray50,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        padding: 20,
    },
    statusCard: {
        backgroundColor: theme.colors.white,
        padding: 20,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        ...theme.shadows.medium,
        marginBottom: 24,
    },
    statusIndicator: {
        width: 12,
        height: 50,
        borderRadius: 6,
        marginRight: 20,
    },
    statusLabel: {
        fontSize: 14,
        color: theme.colors.gray600,
        marginBottom: 4,
    },
    statusValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.gray900,
    },
    statusTime: {
        fontSize: 12,
        color: theme.colors.gray500,
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.gray800,
        marginBottom: 12,
        marginTop: 8,
    },
    dropdown: {
        height: 55,
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 12,
        ...theme.shadows.small,
        marginBottom: 12,
    },
    icon: {
        marginRight: 8,
    },
    placeholderStyle: {
        fontSize: 16,
        color: theme.colors.gray500,
    },
    selectedTextStyle: {
        fontSize: 16,
        color: theme.colors.gray900,
    },
    geofenceInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        backgroundColor: theme.colors.secondary,
        padding: 10,
        borderRadius: 8,
    },
    distanceText: {
        fontSize: 13,
        color: theme.colors.primaryDark,
        marginLeft: 6,
    },
    bold: {
        fontWeight: 'bold',
    },
    actionContainer: {
        marginBottom: 32,
    },
    button: {
        height: 60,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        ...theme.shadows.medium,
    },
    checkInButton: {
        backgroundColor: theme.colors.primary,
    },
    checkOutButton: {
        backgroundColor: theme.colors.error,
    },
    disabledButton: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    historyItem: {
        backgroundColor: theme.colors.white,
        padding: 16,
        marginHorizontal: 20,
        marginBottom: 12,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        ...theme.shadows.small,
    },
    historyIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    historyInfo: {
        flex: 1,
    },
    historyType: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.gray900,
    },
    historyTime: {
        fontSize: 12,
        color: theme.colors.gray500,
        marginTop: 2,
    },
    historyStatus: {
        alignItems: 'flex-end',
    },
    statusBadge: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    listContent: {
        paddingBottom: 40,
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: theme.colors.gray500,
    },
    secondaryActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    secondaryButton: {
        flex: 0.48,
        height: 50,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        ...theme.shadows.small,
    },
    secondaryButtonText: {
        marginLeft: 8,
        fontWeight: 'bold',
        fontSize: 14,
        color: theme.colors.gray700,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.gray700,
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: theme.colors.gray200,
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        fontSize: 16,
    },
    photoButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        backgroundColor: theme.colors.secondary,
        borderRadius: 8,
        marginBottom: 20,
    },
    photoButtonText: {
        marginLeft: 10,
        color: theme.colors.primaryDark,
        fontWeight: '600',
    },
    modalFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 10,
    },
    cancelButton: {
        padding: 12,
        marginRight: 10,
    },
    cancelButtonText: {
        color: theme.colors.gray600,
        fontWeight: '600',
    },
    saveButton: {
        backgroundColor: theme.colors.primary,
        padding: 12,
        borderRadius: 8,
        minWidth: 100,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    settingsLink: {
        height: 50,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        ...theme.shadows.small,
    },
    settingsLinkText: {
        marginLeft: 10,
        fontWeight: 'bold',
        fontSize: 16,
        color: theme.colors.primaryDark,
    },
    adminHubTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.gray900,
        marginBottom: 8,
    },
    adminHubSubtitle: {
        fontSize: 14,
        color: theme.colors.gray600,
        marginBottom: 32,
    },
    adminCard: {
        backgroundColor: theme.colors.white,
        borderRadius: 16,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        ...theme.shadows.medium,
    },
    adminCardIcon: {
        width: 60,
        height: 60,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    adminCardContent: {
        flex: 1,
    },
    adminCardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.gray900,
        marginBottom: 4,
    },
    adminCardDesc: {
        fontSize: 12,
        color: theme.colors.gray500,
    },
});

export default AttendanceScreen;
