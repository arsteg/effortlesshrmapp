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
    ScrollView,
    Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../../store/hooks';
import { Dropdown } from 'react-native-element-dropdown';
import { useLocation } from '../../hooks/useLocation';
import { useCamera } from '../../hooks/useCamera';
import { attendanceService } from '../../services/attendanceService';
import { theme } from '../../theme';
import { calculateDistance } from '../../utils/distance';
import { authService } from '../../services/authService';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Loading } from '../../components/common/Loading';

interface Office {
    _id: string;
    name: string;
    latitude: number;
    longitude: number;
    geofence_radius: number;
    location: {
        type: string;
        coordinates: number[]; // [lng, lat]
    };
    radius: number;
}

interface AttendanceLog {
    _id: string;
    type: 'check-in' | 'check-out';
    timestamp: string;
    status: string;
    anomaly?: {
        type: string;
        isResolved: boolean;
    };
}

const AttendanceScreen = () => {
    const { t } = useTranslation();
    const { location, loading: locationLoading, getCurrentLocation } = useLocation();
    const { takeSelfie } = useCamera();

    const navigation = useNavigation<any>();
    const isAdminPortal = useAppSelector((state) => state.auth.isAdminPortal);
    const user = useAppSelector((state) => state.auth.user);

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
    const [managers, setManagers] = useState<any[]>([]);
    const [manualForm, setManualForm] = useState({
        date: new Date().toISOString().split('T')[0],
        checkInTime: '09:00',
        checkOutTime: '18:00',
        reason: '',
        photoUrl: '',
        managerId: ''
    });

    // User Report State
    const [userReportFromDate, setUserReportFromDate] = useState(new Date());
    const [userReportToDate, setUserReportToDate] = useState(new Date());
    const [userReportData, setUserReportData] = useState<any[]>([]);
    const [reportLoading, setReportLoading] = useState(false);
    const [showReportFromPicker, setShowReportFromPicker] = useState(false);
    const [showReportToPicker, setShowReportToPicker] = useState(false);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const companyId = user?.company?.id || user?.company || (user as any)?.companyId;

            const [officesRes, historyRes]: [any, any] = await Promise.all([
                attendanceService.getOffices({ company: companyId }),
                attendanceService.getHistory({ company: companyId })
            ]);

            if (officesRes.status?.toLowerCase() === 'success') {
                const officesData = officesRes.data?.offices || [];
                setOffices(officesData);
                if (officesData.length > 0) {
                    setSelectedOffice(officesData[0]);
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
            Alert.alert(t('common.error'), t('attendance.load_error') || 'Failed to load attendance data.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [t, user]);

    useEffect(() => {
        loadData();
        loadManagers();
    }, [loadData]);

    const loadManagers = async () => {
        if (!user?.id) return;
        try {
            const response: any = await authService.getUserManagers(user.id);
            if (response.status?.toLowerCase() === 'success' || response.data) {
                const managersData = response.data || [];
                setManagers(managersData.map((m: any) => ({
                    label: m.name || `${m.firstName} ${m.lastName}`,
                    value: m.id || m._id,
                    _id: m.id || m._id,
                    firstName: m.firstName || m.name
                })));
            }
        } catch (error) {
            console.error('Failed to load managers:', error);
        }
    };

    useEffect(() => {
        if (location && selectedOffice) {
            const dist = calculateDistance(
                location.coords.latitude,
                location.coords.longitude,
                selectedOffice.latitude || selectedOffice.location.coordinates[1],
                selectedOffice.longitude || selectedOffice.location.coordinates[0]
            );
            setDistance(dist);
        }
    }, [location, selectedOffice]);

    const handleRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const handleFetchUserReport = async () => {
        setReportLoading(true);
        try {
            const companyId = user?.company?.id || user?.company || (user as any)?.companyId;
            const response: any = await attendanceService.getAttendanceReport({
                userId: user?.id,
                company: companyId,
                fromDate: userReportFromDate.toISOString().split('T')[0],
                toDate: userReportToDate.toISOString().split('T')[0]
            });
            if (response.status?.toLowerCase() === 'success') {
                setUserReportData(response.data?.report || []);
            } else {
                setUserReportData([]);
            }
        } catch (error) {
            console.error('Failed to fetch user report', error);
            Alert.alert(t('common.error'), t('attendance.report_error') || 'Failed to fetch report');
        } finally {
            setReportLoading(false);
        }
    };

    const handleCheckIn = async () => {
        if (!selectedOffice) {
            Alert.alert(t('attendance.office_required') || 'Office Required', t('attendance.select_office_desc') || 'Please select an office location.');
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
                selectedOffice.latitude || selectedOffice.location.coordinates[1],
                selectedOffice.longitude || selectedOffice.location.coordinates[0]
            );

            const allowedRadius = selectedOffice.geofence_radius || selectedOffice.radius;

            if (dist > allowedRadius) {
                Alert.alert(
                    t('attendance.outside_geofence'),
                    `${t('attendance.distance')}: ${Math.round(dist)}m. ${t('attendance.target')}: ${allowedRadius}m.`
                );
                setActionLoading(false);
                return;
            }

            // Selfie mandatory for check-in
            const img = await takeSelfie();
            if (!img) {
                Alert.alert(t('attendance.selfie_required'), t('attendance.verification_selfie'));
                setActionLoading(false);
                return;
            }

            const companyId = user?.company?.id || user?.company || (user as any)?.companyId;
            const userId = user?.id;

            const response: any = await attendanceService.clockIn({
                officeId: selectedOffice._id,
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
                selfieUrl: img,
                deviceId: 'Mobile-App',
                company: companyId
            });

            if (response.status?.toLowerCase() === 'success') {
                Alert.alert(t('common.success'), t('attendance.clock_in_success'));
                loadData();
            } else {
                Alert.alert(t('common.error'), response.message || t('attendance.clock_in_failed') || 'Check-in failed.');
            }
        } catch (error) {
            Alert.alert(t('common.error'), t('common.unexpected_error') || 'An unexpected error occurred.');
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

            const companyId = user?.company?.id || user?.company || (user as any)?.companyId;
            const userId = user?.id;

            const response: any = await attendanceService.clockOut({
                officeId: selectedOffice?._id,
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
                company: companyId
            });

            if (response.status?.toLowerCase() === 'success') {
                Alert.alert(t('common.success'), t('attendance.clock_out_success'));
                loadData();
            } else {
                Alert.alert(t('common.error'), response.message || t('attendance.clock_out_failed') || 'Check-out failed.');
            }
        } catch (error) {
            Alert.alert(t('common.error'), t('common.unexpected_error') || 'An unexpected error occurred.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleManualRequest = async () => {
        if (!manualForm.reason) {
            Alert.alert(t('common.error'), t('attendance.reason_required') || 'Please provide a reason.');
            return;
        }

        if (!manualForm.photoUrl) {
            Alert.alert(t('attendance.photo_required') || 'Photo Required', t('attendance.photo_desc') || 'Please attach a photo.');
            return;
        }

        if (!manualForm.managerId) {
            Alert.alert(t('attendance.manager_required') || 'Manager Required', t('attendance.select_manager') || 'Please select a manager.');
            return;
        }

        setActionLoading(true);
        try {
            const companyId = user?.company?.id || user?.company || (user as any)?.companyId;
            const userId = user?.id;

            const response: any = await attendanceService.requestManualAttendance({
                ...manualForm,
                userId: userId!,
                company: companyId!,
                managerId: manualForm.managerId
            });
            if (response.status?.toLowerCase() === 'success') {
                Alert.alert(t('common.success'), t('attendance.request_submitted'));
                setManualModalVisible(false);
                setManualForm({
                    date: new Date().toISOString().split('T')[0],
                    checkInTime: '09:00',
                    checkOutTime: '18:00',
                    reason: '',
                    photoUrl: '',
                    managerId: ''
                });
                loadData();
            } else {
                Alert.alert(t('common.error'), response.message || t('attendance.request_failed') || 'Request failed.');
            }
        } catch (error) {
            Alert.alert(t('common.error'), t('common.unexpected_error') || 'An unexpected error occurred.');
        } finally {
            setActionLoading(false);
        }
    };

    const renderHistoryItem = ({ item }: { item: AttendanceLog }) => (
        <View style={styles.historyItem}>
            <View style={[styles.historyIcon, { backgroundColor: item.type === 'check-in' ? '#e7f9ee' : '#feeeee' }]}>
                <Ionicons
                    name={item.type === 'check-in' ? 'arrow-down-circle' : 'arrow-up-circle'}
                    size={24}
                    color={item.type === 'check-in' ? theme.colors.success : theme.colors.error}
                />
            </View>
            <View style={styles.historyInfo}>
                <Text style={styles.historyType}>
                    {item.type === 'check-in' ? t('attendance.clocked_in') : t('attendance.clocked_out')}
                </Text>
                <Text style={styles.historyTime}>
                    {new Date(item.timestamp).toLocaleString()}
                </Text>
            </View>
            <View style={styles.historyStatus}>
                <Text style={[styles.statusBadge, { color: item.anomaly ? theme.colors.error : theme.colors.success }]}>
                    {item.anomaly ? t('dashboard.status_anomaly') : t('dashboard.status_verified')}
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

    const isClockedIn = status?.type === 'check-in';

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
                    <Card style={styles.statusCard}>
                        <View style={[styles.statusIndicator, { backgroundColor: isClockedIn ? theme.colors.success : theme.colors.error }]} />
                        <View>
                            <Text style={styles.statusLabel}>{t('attendance.current_status')}</Text>
                            <Text style={styles.statusValue}>{isClockedIn ? t('attendance.clocked_in') : t('attendance.clocked_out')}</Text>
                            {status && (
                                <Text style={styles.statusTime}>{t('attendance.since')} {new Date(status.timestamp).toLocaleTimeString()}</Text>
                            )}
                        </View>
                    </Card>

                    <Text style={styles.sectionTitle}>{t('attendance.select_office')}</Text>
                    <Dropdown
                        style={styles.dropdown}
                        placeholderStyle={styles.placeholderStyle}
                        selectedTextStyle={styles.selectedTextStyle}
                        data={offices}
                        labelField="name"
                        valueField="_id"
                        placeholder={t('attendance.select_office')}
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
                                {t('attendance.distance')}: <Text style={styles.bold}>{Math.round(distance)}m</Text> ({t('attendance.target')}: {selectedOffice.radius}m)
                            </Text>
                        </View>
                    )}

                    <View style={styles.actionContainer}>
                        {!isClockedIn ? (
                            <Button
                                title={t('attendance.clock_in')}
                                onPress={handleCheckIn}
                                icon={<Ionicons name="log-in-outline" size={20} color="#fff" />}
                                loading={actionLoading}
                                style={styles.actionButtonMain}
                            />
                        ) : (
                            <Button
                                title={t('attendance.clock_out')}
                                onPress={handleCheckOut}
                                variant="secondary"
                                icon={<Ionicons name="log-out-outline" size={20} color={theme.colors.white} />}
                                loading={actionLoading}
                                style={[styles.actionButtonMain, { backgroundColor: theme.colors.error }]}
                            />
                        )}
                    </View>

                    <Text style={styles.sectionTitle}>{t('attendance.requests')}</Text>
                    <View style={styles.requestCard}>
                        <TouchableOpacity
                            style={styles.requestItem}
                            onPress={() => setManualModalVisible(true)}
                        >
                            <View style={styles.requestIconContainer}>
                                <Ionicons name="document-text" size={24} color={theme.colors.primary} />
                            </View>
                            <View style={styles.requestTextContainer}>
                                <Text style={styles.requestItemText}>{t('attendance.new_manual_request')}</Text>
                                <Text style={styles.requestItemSubtext}>{t('attendance.submit_correction')}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={theme.colors.gray400} />
                        </TouchableOpacity>

                        <View style={styles.divider} />

                        <TouchableOpacity
                            style={styles.requestItem}
                            onPress={() => navigation.navigate('Attendance Requests')}
                        >
                            <View style={[styles.requestIconContainer, { backgroundColor: '#F0FDF4' }]}>
                                <Ionicons name="list" size={24} color={theme.colors.success} />
                            </View>
                            <View style={styles.requestTextContainer}>
                                <Text style={styles.requestItemText}>{t('attendance.view_request_history')}</Text>
                                <Text style={styles.requestItemSubtext}>{t('attendance.check_approval_status')}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={theme.colors.gray400} />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.sectionTitle}>{t('attendance.recent_activity')}</Text>

                    {/* User Attendance Report Section */}
                    <View style={styles.reportSection}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>{t('attendance.my_attendance_report')}</Text>
                            <TouchableOpacity onPress={handleFetchUserReport}>
                                <Ionicons name="refresh" size={20} color={theme.colors.primary} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.card}>
                            <View style={styles.dateRow}>
                                <TouchableOpacity
                                    style={styles.dateButton}
                                    onPress={() => setShowReportFromPicker(true)}
                                >
                                    <Text style={styles.dateText}>{t('attendance.from')}: {userReportFromDate.toLocaleDateString()}</Text>
                                    <Ionicons name="calendar-outline" size={16} color={theme.colors.primary} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.dateButton}
                                    onPress={() => setShowReportToPicker(true)}
                                >
                                    <Text style={styles.dateText}>{t('attendance.to')}: {userReportToDate.toLocaleDateString()}</Text>
                                    <Ionicons name="calendar-outline" size={16} color={theme.colors.primary} />
                                </TouchableOpacity>
                            </View>

                            {(showReportFromPicker || showReportToPicker) && (
                                <DateTimePicker
                                    value={showReportFromPicker ? userReportFromDate : userReportToDate}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={(event, selectedDate) => {
                                        if (Platform.OS === 'android') {
                                            setShowReportFromPicker(false);
                                            setShowReportToPicker(false);
                                        }
                                        if (selectedDate) {
                                            if (showReportFromPicker) {
                                                setUserReportFromDate(selectedDate);
                                                if (Platform.OS === 'ios') setShowReportFromPicker(false);
                                            } else {
                                                setUserReportToDate(selectedDate);
                                                if (Platform.OS === 'ios') setShowReportToPicker(false);
                                            }
                                        }
                                    }}
                                />
                            )}

                            <TouchableOpacity
                                style={[styles.secondaryButton, { width: '100%', marginTop: 10, backgroundColor: theme.colors.primary }]}
                                onPress={handleFetchUserReport}
                            >
                                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>{t('attendance.get_report')}</Text>
                            </TouchableOpacity>

                            {reportLoading ? (
                                <ActivityIndicator style={{ marginTop: 10 }} color={theme.colors.primary} />
                            ) : (
                                userReportData.length > 0 && (
                                    <View style={{ marginTop: 15 }}>
                                        <View style={styles.tableHeader}>
                                            <Text style={[styles.tableHeadText, { flex: 1 }]}>{t('attendance.date')}</Text>
                                            <Text style={[styles.tableHeadText, { flex: 1 }]}>{t('attendance.in')}</Text>
                                            <Text style={[styles.tableHeadText, { flex: 1 }]}>{t('attendance.out')}</Text>
                                            <Text style={[styles.tableHeadText, { flex: 1, textAlign: 'right' }]}>{t('attendance.total')}</Text>
                                        </View>
                                        {userReportData.map((item, index) => (
                                            <View key={index} style={styles.tableRow}>
                                                <Text style={[styles.tableCell, { flex: 1 }]}>{item.date}</Text>
                                                <Text style={[styles.tableCell, { flex: 1 }]}>
                                                    {item.inTime ? new Date(item.inTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                                                </Text>
                                                <Text style={[styles.tableCell, { flex: 1 }]}>
                                                    {item.outTime ? new Date(item.outTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                                                </Text>
                                                <Text style={[styles.tableCell, { flex: 1, textAlign: 'right', fontWeight: 'bold' }]}>
                                                    {item.totalTimeMs ? Math.floor(item.totalTimeMs / (1000 * 60 * 60)) + 'h ' + Math.floor((item.totalTimeMs % (1000 * 60 * 60)) / (1000 * 60)) + 'm' : '-'}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                )
                            )}
                        </View>
                    </View>
                </View>
            }
            ListEmptyComponent={
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>{t('attendance.no_records')}</Text>
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
                <Text style={styles.adminHubTitle}>{t('attendance.title')}</Text>
                <Text style={styles.adminHubSubtitle}>{t('attendance.subtitle')}</Text>

                <TouchableOpacity
                    style={styles.adminCard}
                    onPress={() => navigation.navigate('Office Settings')}
                >
                    <View style={[styles.adminCardIcon, { backgroundColor: '#eef2ff' }]}>
                        <Ionicons name="business" size={32} color={theme.colors.primary} />
                    </View>
                    <View style={styles.adminCardContent}>
                        <Text style={styles.adminCardTitle}>{t('attendance.office_management')}</Text>
                        <Text style={styles.adminCardDesc}>{t('attendance.office_management_desc')}</Text>
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
                        <Text style={styles.adminCardTitle}>{t('attendance.attendance_requests')}</Text>
                        <Text style={styles.adminCardDesc}>{t('attendance.attendance_requests_desc')}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color={theme.colors.gray400} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.adminCard}
                    onPress={() => navigation.navigate('Attendance Report')}
                >
                    <View style={[styles.adminCardIcon, { backgroundColor: '#f0fdf4' }]}>
                        <Ionicons name="bar-chart" size={32} color={theme.colors.success} />
                    </View>
                    <View style={styles.adminCardContent}>
                        <Text style={styles.adminCardTitle}>{t('attendance.attendance_report')}</Text>
                        <Text style={styles.adminCardDesc}>{t('attendance.attendance_report_desc')}</Text>
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
                        <Text style={styles.modalTitle}>{t('attendance.manual_request_title')}</Text>
                        <ScrollView>
                            <Text style={styles.label}>{t('attendance.date')}</Text>
                            <TextInput
                                style={styles.input}
                                value={manualForm.date}
                                placeholder="YYYY-MM-DD"
                                onChangeText={(text) => setManualForm({ ...manualForm, date: text })}
                            />

                            <View style={styles.row}>
                                <View style={{ flex: 1, marginRight: 8 }}>
                                    <Input
                                        label={t('attendance.check_in_time')}
                                        value={manualForm.checkInTime}
                                        placeholder="HH:MM"
                                        onChangeText={(text) => setManualForm({ ...manualForm, checkInTime: text })}
                                    />
                                </View>
                                <View style={{ flex: 1, marginLeft: 8 }}>
                                    <Input
                                        label={t('attendance.check_out_time')}
                                        value={manualForm.checkOutTime}
                                        placeholder="HH:MM"
                                        onChangeText={(text) => setManualForm({ ...manualForm, checkOutTime: text })}
                                    />
                                </View>
                            </View>

                            <Input
                                label={t('attendance.reason')}
                                style={{ height: 100, textAlignVertical: 'top' }}
                                multiline
                                numberOfLines={4}
                                placeholder={t('attendance.reason_placeholder')}
                                value={manualForm.reason}
                                onChangeText={(text) => setManualForm({ ...manualForm, reason: text })}
                            />

                            <Text style={styles.label}>{t('attendance.select_manager')}</Text>
                            <Dropdown
                                style={styles.dropdown}
                                placeholderStyle={styles.placeholderStyle}
                                selectedTextStyle={styles.selectedTextStyle}
                                data={managers}
                                labelField="label"
                                valueField="value"
                                placeholder={t('attendance.select_manager')}
                                value={manualForm.managerId}
                                onChange={(item) => setManualForm({ ...manualForm, managerId: item.value })}
                                renderLeftIcon={() => (
                                    <Ionicons style={{ marginRight: 8 }} color="#666" name="person-outline" size={20} />
                                )}
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
                                    {manualForm.photoUrl ? t('attendance.photo_attached') : t('attendance.attach_photo')}
                                </Text>
                            </TouchableOpacity>
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setManualModalVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.saveButton}
                                onPress={handleManualRequest}
                            >
                                <Text style={styles.saveButtonText}>{t('common.submit')}</Text>
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
        backgroundColor: '#F8F9FA', // Lighter background for cleanliness
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 20,
    },
    statusCard: {
        backgroundColor: theme.colors.white,
        padding: 24,
        borderRadius: 24, // Softer curves
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 4,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
    },
    statusIndicator: {
        width: 6,
        height: 60,
        borderRadius: 10,
        marginRight: 20,
    },
    statusLabel: {
        fontSize: 13,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        color: theme.colors.gray500,
        fontWeight: '600',
        marginBottom: 6,
    },
    statusValue: {
        fontSize: 26, // Larger hero text
        fontWeight: '800', // Stronger weight
        color: theme.colors.gray900,
        letterSpacing: -0.5,
    },
    statusTime: {
        fontSize: 13,
        color: theme.colors.gray500,
        marginTop: 6,
        fontWeight: '500',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.gray900,
        marginBottom: 16,
        marginTop: 8,
        letterSpacing: -0.3,
    },
    dropdown: {
        height: 56,
        backgroundColor: theme.colors.white,
        borderRadius: 16,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#EAEAEA',
        marginBottom: 16,
    },
    icon: {
        marginRight: 10,
    },
    placeholderStyle: {
        fontSize: 15,
        color: theme.colors.gray500,
        fontWeight: '500',
    },
    selectedTextStyle: {
        fontSize: 15,
        color: theme.colors.gray900,
        fontWeight: '600',
    },
    geofenceInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        backgroundColor: 'rgba(52, 168, 83, 0.1)', // Subtle green tint
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    distanceText: {
        fontSize: 13,
        color: theme.colors.success,
        marginLeft: 8,
        fontWeight: '600',
    },
    bold: {
        fontWeight: '800',
    },
    actionContainer: {
        marginBottom: 32,
        alignItems: 'center', // Center hero button
    },
    actionButtonMain: {
        height: 64, // Taller button
        borderRadius: 32, // Pill shape
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
    button: {
        height: 64, // Taller button
        borderRadius: 32, // Pill shape
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
    checkInButton: {
        backgroundColor: theme.colors.primary,
    },
    checkOutButton: {
        backgroundColor: theme.colors.error,
        shadowColor: theme.colors.error,
    },
    disabledButton: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    requestCard: {
        backgroundColor: theme.colors.white,
        borderRadius: 24,
        padding: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.02)',
    },
    requestItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
    },
    requestIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    requestTextContainer: {
        flex: 1,
    },
    requestItemText: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.gray900,
        marginBottom: 2,
    },
    requestItemSubtext: {
        fontSize: 13,
        color: theme.colors.gray500,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginLeft: 80, // Align with text
        marginRight: 20,
    },
    historyItem: {
        backgroundColor: theme.colors.white,
        padding: 20,
        marginHorizontal: 20,
        marginBottom: 16,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.02)',
    },
    historyIcon: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 18,
    },
    historyInfo: {
        flex: 1,
    },
    historyType: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.gray900,
        marginBottom: 4,
    },
    historyTime: {
        fontSize: 13,
        color: theme.colors.gray500,
        fontWeight: '500',
    },
    historyStatus: {
        alignItems: 'flex-end',
        justifyContent: 'center',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
    },
    statusBadge: {
        fontSize: 12,
        fontWeight: '700',
    },
    listContent: {
        paddingBottom: 60,
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: theme.colors.gray400,
        fontSize: 15,
        fontWeight: '500',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)', // Darker overlay
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        maxHeight: '85%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.2,
        shadowRadius: 30,
        elevation: 10,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 24,
        textAlign: 'center',
        color: theme.colors.gray900,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.gray700,
        marginBottom: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: '#EAEAEA',
        borderRadius: 14,
        padding: 16,
        marginBottom: 20,
        fontSize: 15,
        color: theme.colors.gray900,
        backgroundColor: '#F9FAFB',
    },
    photoButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        backgroundColor: '#F0F9FF',
        borderRadius: 14,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#BAE6FD',
    },
    photoButtonText: {
        marginLeft: 10,
        color: theme.colors.primary,
        fontWeight: '700',
        fontSize: 15,
    },
    modalFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
        gap: 16,
    },
    cancelButton: {
        flex: 1,
        padding: 16,
        backgroundColor: '#F3F4F6',
        borderRadius: 14,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: theme.colors.gray600,
        fontWeight: '700',
        fontSize: 15,
    },
    saveButton: {
        flex: 1,
        backgroundColor: theme.colors.primary,
        padding: 16,
        borderRadius: 14,
        alignItems: 'center',
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },
    adminHubTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: theme.colors.gray900,
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    adminHubSubtitle: {
        fontSize: 15,
        color: theme.colors.gray500,
        marginBottom: 32,
        lineHeight: 22,
    },
    adminCard: {
        backgroundColor: theme.colors.white,
        borderRadius: 24,
        padding: 24,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 4,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
    },
    adminCardIcon: {
        width: 64,
        height: 64,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 20,
    },
    adminCardTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: theme.colors.gray900,
        marginBottom: 6,
    },
    adminCardDesc: {
        fontSize: 14,
        color: theme.colors.gray500,
        lineHeight: 20,
    },
    reportSection: {
        marginBottom: 30,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    dateRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
        gap: 12,
    },
    dateButton: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 14,
    },
    dateText: { fontSize: 13, color: theme.colors.gray700, fontWeight: '600' },
    secondaryButton: {
        flex: 1,
        height: 52,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.primary,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    tableHeader: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        paddingBottom: 12,
        marginBottom: 12,
    },
    tableHeadText: { fontSize: 12, fontWeight: '700', color: theme.colors.gray400, textTransform: 'uppercase', letterSpacing: 0.5 },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    tableCell: { fontSize: 13, color: theme.colors.gray700, fontWeight: '500' },
    settingsLink: {
        height: 50,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    settingsLinkText: {
        marginLeft: 10,
        fontWeight: 'bold',
        fontSize: 16,
        color: theme.colors.primaryDark,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    adminCardContent: {
        flex: 1
    }
});

export default AttendanceScreen;
