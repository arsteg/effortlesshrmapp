import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    Dimensions,
    Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { PieChart } from 'react-native-chart-kit';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
    fetchDashboardData,
    fetchPaymentInfo,
    fetchTeamMembers,
    setSelectedDate,
    setSelectedProductivityUserId,
    setSelectedTaskUserId,
    setSelectedProjectUserId,
} from '../../store/slices/dashboardSlice';
import { Card } from '../../components/common/Card';
import { Loading } from '../../components/common/Loading';
import { theme } from '../../theme';
import { attendanceService } from '../../services/attendanceService';
import { Alert, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { dashboardService } from '../../services/dashboardService';

const screenWidth = Dimensions.get('window').width;

export const DashboardScreen = ({ navigation }: any) => {
    const dispatch = useAppDispatch();
    const { user } = useAppSelector((state) => state.auth);
    const {
        hoursWorked,
        weeklySummary,
        monthlySummary,
        applicationTimeSummary,
        taskStatusCounts,
        projectWiseTasks,
        paymentInfo,
        teamMembers,
        selectedProductivityUserId,
        selectedTaskUserId,
        selectedProjectUserId,
        selectedDate,
        isLoading,
    } = useAppSelector((state) => state.dashboard);

    const [refreshing, setRefreshing] = useState(false);
    const [attendanceStatus, setAttendanceStatus] = useState<'In' | 'Out' | null>(null);
    const [punchLoading, setPunchLoading] = useState(false);
    const [punchTime, setPunchTime] = useState<string | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);

    const isAdmin = user?.isAdmin || false;

    useEffect(() => {
        if (user?.id) {
            loadDashboardData();
            if (isAdmin) {
                dispatch(fetchPaymentInfo());
                dispatch(fetchTeamMembers(user.id));
            }
        }
    }, [user?.id]);

    useEffect(() => {
        if (user?.id) {
            loadDashboardData();
        }
    }, [selectedDate]);

    // Load data when user selection changes
    useEffect(() => {
        if (selectedProductivityUserId && user?.id) {
            loadProductivityData();
        }
    }, [selectedProductivityUserId]);

    useEffect(() => {
        if (selectedTaskUserId && user?.id) {
            loadTaskStatusData();
        }
    }, [selectedTaskUserId]);

    useEffect(() => {
        if (selectedProjectUserId && user?.id) {
            loadProjectWiseData();
        }
    }, [selectedProjectUserId]);

    const loadDashboardData = () => {
        if (user?.id) {
            const date = new Date(selectedDate).toDateString();
            dispatch(fetchDashboardData({ userId: user.id, date }));
        }
    };

    const loadProductivityData = async () => {
        if (!selectedProductivityUserId) return;
        try {
            const date = new Date(selectedDate).toDateString();
            const data = await dashboardService.getApplicationTimeSummary(selectedProductivityUserId, date);
            // Update would need to be handled via dispatch - for now just reload all
            loadDashboardData();
        } catch (error) {
            console.error('Failed to load productivity data', error);
        }
    };

    const loadTaskStatusData = async () => {
        if (!selectedTaskUserId) return;
        try {
            const data = await dashboardService.getTaskStatusCounts(selectedTaskUserId);
            loadDashboardData();
        } catch (error) {
            console.error('Failed to load task status data', error);
        }
    };

    const loadProjectWiseData = async () => {
        if (!selectedProjectUserId) return;
        try {
            const data = await dashboardService.getTaskWiseHours(selectedProjectUserId);
            loadDashboardData();
        } catch (error) {
            console.error('Failed to load project-wise data', error);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadDashboardData();
        //await fetchAttendanceStatus();
        setRefreshing(false);
    };

    const fetchAttendanceStatus = async () => {
        if (!user?.id) return;
        try {
            const status = await attendanceService.getTodayStatus(user.id);
            if (status.status) {
                setAttendanceStatus(status.status);
                setPunchTime(status.status === 'In' ? status.inTime : status.outTime);
            }
        } catch (error) {
            console.error('Failed to fetch attendance status', error);
        }
    };

    const handlePunch = async () => {
        setPunchLoading(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission to access location was denied');
                setPunchLoading(false);
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            const locationData = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            };

            if (attendanceStatus === 'In') {
                await attendanceService.clockOut(locationData);
                Alert.alert('Success', 'Clocked Out Successfully');
                setAttendanceStatus('Out');
            } else {
                await attendanceService.clockIn(locationData);
                Alert.alert('Success', 'Clocked In Successfully');
                setAttendanceStatus('In');
            }
            //await fetchAttendanceStatus();
        } catch (error) {
            console.error('Punch failed', error);
            Alert.alert('Error', 'Failed to update attendance');
        } finally {
            setPunchLoading(false);
        }
    };

    const handleDateChange = (event: any, selectedDateValue?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDateValue) {
            dispatch(setSelectedDate(selectedDateValue.toISOString()));
        }
    };

    const formatTime = (milliseconds?: number) => {
        if (!milliseconds) return '00:00';
        const hours = Math.floor(milliseconds / 3600000);
        const minutes = Math.floor((milliseconds % 3600000) / 60000);
        return `${hours}h ${minutes}m`;
    };

    const getShortName = () => {
        if (!user) return '';
        const firstName = user.firstName || '';
        const lastName = user.lastName || '';
        if (firstName && lastName) {
            return `${firstName[0]}${lastName[0]}`.toUpperCase();
        }
        return firstName ? firstName.substring(0, 2).toUpperCase() : '';
    };

    const renderTimeCard = (
        title: string,
        current: number,
        previous: number,
        percentage: number,
        isLess: boolean
    ) => (
        <Card style={styles.timeCard}>
            <View style={styles.timeCardContent}>
                <View style={styles.timeCardLeft}>
                    <Text style={styles.timeCardTitle}>{title}</Text>
                    <Text style={styles.timeCardValue}>{formatTime(current)}</Text>
                    <View style={styles.comparisonRow}>
                        <View style={[styles.percentageBadge, { backgroundColor: isLess ? theme.colors.warning : theme.colors.success }]}>
                            <Text style={styles.percentageText}>
                                {isLess ? '-' : '+'}{percentage.toFixed(1)}%
                            </Text>
                        </View>
                        <View style={styles.previousBadge}>
                            <Text style={styles.previousText}>{formatTime(previous)}</Text>
                        </View>
                    </View>
                </View>
                <Ionicons
                    name={isLess ? 'trending-down' : 'trending-up'}
                    size={50}
                    color={isLess ? theme.colors.warning : theme.colors.success}
                />
            </View>
        </Card>
    );

    const productivityChartData = applicationTimeSummary.map((item, index) => ({
        name: item.name,
        population: item.value,
        color: index === 0 ? theme.colors.productive : index === 1 ? theme.colors.nonProductive : theme.colors.neutral,
        legendFontColor: theme.colors.textPrimary,
        legendFontSize: 12,
    }));

    const taskChartData = taskStatusCounts.map((item, index) => {
        const colors = ['#a8385d', '#7aa3e5', '#a27ea8', '#00fa9a'];
        return {
            name: item.name,
            population: item.value,
            color: colors[index] || theme.colors.gray500,
            legendFontColor: theme.colors.textPrimary,
            legendFontSize: 12,
        };
    });

    if (isLoading && !refreshing) {
        return <Loading message="Loading dashboard..." />;
    }

    return (
        <View style={styles.container}>
            <StatusBar style="light" backgroundColor={theme.colors.primary} />
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
                }
            >
                {/* Date Picker Card */}
                <Card style={styles.dateCard}>
                    <Text style={styles.dateLabel}>Selected Date</Text>
                    <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateButton}>
                        <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
                        <Text style={styles.dateText}>{new Date(selectedDate).toLocaleDateString()}</Text>
                    </TouchableOpacity>
                    {showDatePicker && (
                        <DateTimePicker
                            value={new Date(selectedDate)}
                            mode="date"
                            display="default"
                            onChange={handleDateChange}
                        />
                    )}
                </Card>

                {/* Clock In/Out Card */}
                <Card style={styles.timeCard}>
                    <View style={[styles.timeCardContent, { paddingVertical: 10 }]}>
                        <View>
                            <Text style={styles.timeCardTitle}>Attendance</Text>
                            <Text style={[styles.timeCardValue, { color: attendanceStatus === 'In' ? theme.colors.success : theme.colors.textPrimary }]}>
                                {attendanceStatus === 'In' ? 'Checked In' : 'Checked Out'}
                            </Text>
                            {punchTime && (
                                <Text style={styles.paymentLabel}>Last Punch: {new Date(punchTime).toLocaleTimeString()}</Text>
                            )}
                        </View>
                        <TouchableOpacity
                            style={[
                                styles.punchButton,
                                { backgroundColor: attendanceStatus === 'In' ? theme.colors.error : theme.colors.success }
                            ]}
                            onPress={handlePunch}
                            disabled={punchLoading}
                        >
                            {punchLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.punchButtonText}>
                                    {attendanceStatus === 'In' ? 'Punch Out' : 'Punch In'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </Card>

                {/* Admin Profile Card */}
                {isAdmin && (
                    <View style={styles.adminSection}>
                        <Card style={styles.profileCard}>
                            <View style={styles.avatarContainer}>
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>{getShortName()}</Text>
                                </View>
                            </View>
                            <Text style={styles.profileName}>{user?.FullName}</Text>
                            <Text style={styles.profileRole}>Admin</Text>
                            <Text style={styles.membersText}>Members: {teamMembers.length - 1}</Text>
                        </Card>

                        {paymentInfo && (
                            <>
                                <Card style={styles.paymentCard}>
                                    <Text style={styles.paymentTitle}>Next Payment</Text>
                                    <View style={styles.paymentRow}>
                                        <Text style={styles.paymentLabel}>Due Date:</Text>
                                        <Text style={styles.paymentValue}>
                                            {paymentInfo.due_date ? new Date(paymentInfo.due_date).toLocaleDateString() : 'N/A'}
                                        </Text>
                                    </View>
                                    <View style={styles.paymentRow}>
                                        <Text style={styles.paymentLabel}>Due Amount:</Text>
                                        <Text style={styles.paymentValue}>${paymentInfo.total_due_amount || 0}</Text>
                                    </View>
                                </Card>

                                <Card style={styles.paymentCard}>
                                    <Text style={styles.paymentTitle}>Latest Payment</Text>
                                    <View style={styles.paymentRow}>
                                        <Text style={styles.paymentLabel}>Method:</Text>
                                        <Text style={styles.paymentValue}>{paymentInfo.payment_method || 'N/A'}</Text>
                                    </View>
                                    <View style={styles.paymentRow}>
                                        <Text style={styles.paymentLabel}>Amount:</Text>
                                        <Text style={styles.paymentValue}>${paymentInfo.amount || 0}</Text>
                                    </View>
                                </Card>
                            </>
                        )}
                    </View>
                )}

                {/* Time Summary Cards */}
                {hoursWorked && renderTimeCard(
                    'Today',
                    hoursWorked.today,
                    hoursWorked.previousDay,
                    hoursWorked.PercentageDifference,
                    hoursWorked.IsLessThanPrevious
                )}

                {weeklySummary && renderTimeCard(
                    'This Week',
                    weeklySummary.currentWeek,
                    weeklySummary.previousWeek,
                    weeklySummary.PercentageDifference,
                    weeklySummary.IsLessThanPrevious
                )}

                {monthlySummary && renderTimeCard(
                    'This Month',
                    monthlySummary.currentMonth,
                    monthlySummary.previousMonth,
                    monthlySummary.PercentageDifference,
                    monthlySummary.IsLessThanPrevious
                )}

                {/* Productivity Chart */}
                <Card style={styles.chartCard}>
                    <View style={styles.chartHeader}>
                        <Text style={styles.chartTitle}>Productivity</Text>
                        {isAdmin && teamMembers.length > 0 && (
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={selectedProductivityUserId || user?.id}
                                    onValueChange={(value) => dispatch(setSelectedProductivityUserId(value))}
                                    style={styles.picker}
                                >
                                    {teamMembers.map((member) => (
                                        <Picker.Item
                                            key={member.id}
                                            label={member.firstName || member.FullName}
                                            value={member.id}
                                        />
                                    ))}
                                </Picker>
                            </View>
                        )}
                    </View>
                    {productivityChartData.length > 0 ? (
                        <PieChart
                            data={productivityChartData}
                            width={screenWidth - 60}
                            height={220}
                            chartConfig={{
                                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                            }}
                            accessor="population"
                            backgroundColor="transparent"
                            paddingLeft="15"
                            absolute
                        />
                    ) : (
                        <View style={styles.emptyState}>
                            <Ionicons name="pie-chart-outline" size={48} color={theme.colors.gray400} />
                            <Text style={styles.emptyStateText}>No productivity data available</Text>
                        </View>
                    )}
                </Card>

                {/* Task Summary Chart */}
                <Card style={styles.chartCard}>
                    <View style={styles.chartHeader}>
                        <Text style={styles.chartTitle}>Tasks Summary</Text>
                        {isAdmin && teamMembers.length > 0 && (
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={selectedTaskUserId || user?.id}
                                    onValueChange={(value) => dispatch(setSelectedTaskUserId(value))}
                                    style={styles.picker}
                                >
                                    {teamMembers.map((member) => (
                                        <Picker.Item
                                            key={member.id}
                                            label={member.firstName || member.FullName}
                                            value={member.id}
                                        />
                                    ))}
                                </Picker>
                            </View>
                        )}
                    </View>
                    {taskChartData.length > 0 ? (
                        <PieChart
                            data={taskChartData}
                            width={screenWidth - 60}
                            height={220}
                            chartConfig={{
                                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                            }}
                            accessor="population"
                            backgroundColor="transparent"
                            paddingLeft="15"
                            absolute
                        />
                    ) : (
                        <View style={styles.emptyState}>
                            <Ionicons name="checkbox-outline" size={48} color={theme.colors.gray400} />
                            <Text style={styles.emptyStateText}>No task data available</Text>
                        </View>
                    )}
                </Card>

                {/* Project-wise Tasks */}
                <Card style={styles.tableCard}>
                    <View style={styles.chartHeader}>
                        <Text style={styles.chartTitle}>Project-wise Time Spent</Text>
                        {isAdmin && teamMembers.length > 0 && (
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={selectedProjectUserId || user?.id}
                                    onValueChange={(value) => dispatch(setSelectedProjectUserId(value))}
                                    style={styles.picker}
                                >
                                    {teamMembers.map((member) => (
                                        <Picker.Item
                                            key={member.id}
                                            label={member.firstName || member.FullName}
                                            value={member.id}
                                        />
                                    ))}
                                </Picker>
                            </View>
                        )}
                    </View>
                    {projectWiseTasks.length > 0 ? (
                        <>
                            <View style={styles.tableHeader}>
                                <Text style={[styles.tableHeaderText, styles.projectColumn]}>Project</Text>
                                <Text style={[styles.tableHeaderText, styles.taskColumn]}>Task</Text>
                                <Text style={[styles.tableHeaderText, styles.timeColumn]}>Time</Text>
                            </View>
                            {projectWiseTasks.slice(0, 10).map((item, index) => (
                                <View key={index} style={styles.tableRow}>
                                    <Text style={[styles.tableCell, styles.projectColumn]} numberOfLines={1}>{item.name}</Text>
                                    <Text style={[styles.tableCell, styles.taskColumn]} numberOfLines={1}>{item.taskName}</Text>
                                    <View style={styles.timeBadge}>
                                        <Text style={styles.timeText}>{item.timeTaken}</Text>
                                    </View>
                                </View>
                            ))}
                        </>
                    ) : (
                        <View style={styles.emptyState}>
                            <Ionicons name="folder-open-outline" size={48} color={theme.colors.gray400} />
                            <Text style={styles.emptyStateText}>No project data available</Text>
                        </View>
                    )}
                </Card>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.backgroundSecondary,
    },
    scrollContent: {
        padding: theme.spacing.md,
    },
    dateCard: {
        marginBottom: theme.spacing.md,
    },
    dateLabel: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.xs,
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.sm,
        backgroundColor: theme.colors.backgroundSecondary,
        borderRadius: theme.borderRadius.md,
    },
    dateText: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.textPrimary,
        marginLeft: theme.spacing.sm,
    },
    adminSection: {
        marginBottom: theme.spacing.md,
    },
    profileCard: {
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    avatarContainer: {
        marginBottom: theme.spacing.sm,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: theme.typography.fontSize.xxl,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.white,
    },
    profileName: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.textPrimary,
    },
    profileRole: {
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.xs,
    },
    membersText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.sm,
    },
    paymentCard: {
        marginBottom: theme.spacing.sm,
    },
    paymentTitle: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.bold,
        marginBottom: theme.spacing.sm,
    },
    paymentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: theme.spacing.xs,
    },
    paymentLabel: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.textSecondary,
    },
    paymentValue: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.textPrimary,
    },
    timeCard: {
        marginBottom: theme.spacing.md,
    },
    timeCardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    timeCardLeft: {
        flex: 1,
    },
    timeCardTitle: {
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.textSecondary,
    },
    timeCardValue: {
        fontSize: theme.typography.fontSize.xxl,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.textPrimary,
        marginVertical: theme.spacing.xs,
    },
    comparisonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: theme.spacing.xs,
    },
    percentageBadge: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.borderRadius.sm,
        marginRight: theme.spacing.sm,
    },
    percentageText: {
        color: theme.colors.white,
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.bold,
    },
    previousBadge: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        backgroundColor: theme.colors.gray200,
        borderRadius: theme.borderRadius.sm,
    },
    previousText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.textSecondary,
    },
    chartCard: {
        marginBottom: theme.spacing.md,
    },
    chartHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
        width: '100%',
    },
    chartTitle: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
    },
    pickerContainer: {
        flex: 1,
        marginLeft: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.gray300,
        borderRadius: theme.borderRadius.sm,
        backgroundColor: theme.colors.white,
    },
    picker: {
        height: 40,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.xl,
    },
    emptyStateText: {
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.sm,
    },
    tableCard: {
        marginBottom: theme.spacing.md,
    },
    tableHeader: {
        flexDirection: 'row',
        borderBottomWidth: 2,
        borderBottomColor: theme.colors.primary,
        paddingBottom: theme.spacing.sm,
        marginBottom: theme.spacing.sm,
    },
    tableHeaderText: {
        fontWeight: theme.typography.fontWeight.bold,
        fontSize: theme.typography.fontSize.md,
    },
    tableRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray200,
    },
    tableCell: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.textPrimary,
    },
    projectColumn: {
        flex: 2,
    },
    taskColumn: {
        flex: 3,
    },
    timeColumn: {
        flex: 1,
        textAlign: 'right',
    },
    timeBadge: {
        flex: 1,
        backgroundColor: theme.colors.secondary,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.borderRadius.sm,
        alignItems: 'center',
    },
    timeText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.primary,
        fontWeight: theme.typography.fontWeight.bold,
    },
    punchButton: {
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.borderRadius.md,
        minWidth: 100,
        alignItems: 'center',
    },
    punchButtonText: {
        color: theme.colors.white,
        fontWeight: 'bold',
        fontSize: theme.typography.fontSize.md,
    },
});
