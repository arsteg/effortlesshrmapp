import React, { useEffect, useState } from 'react';
import { Dropdown } from 'react-native-element-dropdown';

import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    Platform,
    Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { PieChart } from 'react-native-chart-kit';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchTeamMembers } from '../../store/slices/dashboardSlice';
import { Card } from '../../components/common/Card';
import { Loading } from '../../components/common/Loading';
import { theme } from '../../theme';
import { dashboardService } from '../../services/dashboardService';
import {
    HoursWorkedData,
    WeeklySummaryData,
    MonthlySummaryData,
    TimeSpentPeriod,
    User
} from '../../types';

const screenWidth = Dimensions.get('window').width;

export const AdminDashboardScreen = ({ navigation }: any) => {
    const dispatch = useAppDispatch();
    const { user } = useAppSelector((state) => state.auth);
    const { teamMembers, paymentInfo } = useAppSelector((state) => state.dashboard);

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedTimeSpent, setSelectedTimeSpent] = useState<TimeSpentPeriod>('Daily');
    const [selectedMember, setSelectedMember] = useState<User | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    const [hoursWorked, setHoursWorked] = useState<HoursWorkedData | null>(null);
    const [weeklySummary, setWeeklySummary] = useState<WeeklySummaryData | null>(null);
    const [monthlySummary, setMonthlySummary] = useState<MonthlySummaryData | null>(null);
    const [projectTasks, setProjectTasks] = useState<any[]>([]);
    const [productivityData, setProductivityData] = useState<any[]>([]);
    const [taskSummary, setTaskSummary] = useState<any[]>([]);
    const [dayWorkStatus, setDayWorkStatus] = useState<any[]>([]);
    const [isFocus, setIsFocus] = useState(false);

    useEffect(() => {
        if (user?.id) {
            dispatch(fetchTeamMembers(user.id));
        }
    }, [user?.id, dispatch]);

    useEffect(() => {
        if (teamMembers.length > 0 && !selectedMember) {
            setSelectedMember(teamMembers[0]);
        }
    }, [teamMembers]);

    useEffect(() => {
        if (selectedMember?.id) {
            loadDashboardData();
        }
    }, [selectedDate, selectedMember?.id]);

    const loadDashboardData = async () => {
        if (!selectedMember?.id) return;
        console.log('Loading dashboard data for member:', selectedMember.firstName || selectedMember.FullName);
        setLoading(true);
        try {
            const date = selectedDate.toISOString().split('T')[0];
            console.log('Selected date:', date);
            const [
                hoursData,
                weeklyData,
                monthlyData,
                projectTasksData,
                productivityChartData,
                taskSummaryData,
                dayWorkStatusData
            ] = await Promise.all([
                dashboardService.getHoursWorked(selectedMember.id, date),
                dashboardService.getWeeklySummary(selectedMember.id, date),
                dashboardService.getMonthlySummary(selectedMember.id, date),
                dashboardService.getTaskWiseHours(selectedMember.id),
                dashboardService.getApplicationTimeSummary(selectedMember.id, date),
                dashboardService.getTaskStatusCounts(selectedMember.id),
                dashboardService.getDayWorkStatusByUser(selectedMember.id, date),
            ]);

            setHoursWorked(hoursData);
            setWeeklySummary(weeklyData);
            setMonthlySummary(monthlyData);
            setProjectTasks(projectTasksData);
            setProductivityData(productivityChartData);
            setTaskSummary(taskSummaryData);
            setDayWorkStatus(dayWorkStatusData);
        } catch (error) {
            console.error('Failed to load dashboard data', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadDashboardData();
        setRefreshing(false);
    };

    const handleDateChange = (event: any, selectedDateValue?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDateValue) {
            setSelectedDate(selectedDateValue);
        }
    };

    const formatTime = (milliseconds?: number) => {
        console.log('Formatting time for milliseconds:', milliseconds);
        if (!milliseconds) return '0h 0m';
        const totalSeconds = Math.floor(milliseconds / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        console.log(`Formatting time: ${milliseconds} ms = ${hours}h ${minutes}m`);
        return `${hours}h ${minutes}m`;
    };

    const formatHoursAndMinutes = (hours?: number) => {
        if (!hours) return '0h 0m';
        const roundedHours = Math.floor(hours);
        const minutes = Math.round((hours - roundedHours) * 60);
        return `${roundedHours}h ${minutes}m`;
    };

    const formatMinutesToHoursAndMinutes = (minutes?: number) => {
        if (!minutes) return '0h 0m';
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}h ${Math.floor(remainingMinutes)}m`;
    };

    const calculatePercentage = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
    };

    const getTimeSpentData = () => {
        switch (selectedTimeSpent) {
            case 'Daily':
                return {
                    current: hoursWorked?.today || 10,
                    previous: hoursWorked?.previousDay || 0,
                    currentLabel: 'Today',
                    previousLabel: 'Yesterday',
                    formatter: formatTime,
                    percentage: calculatePercentage(hoursWorked?.today || 0, hoursWorked?.previousDay || 0),
                    isLess: (hoursWorked?.today || 0) < (hoursWorked?.previousDay || 0),
                };
            case 'Weekly':
                return {
                    current: weeklySummary?.currentWeek || 0,
                    previous: weeklySummary?.previousWeek || 0,
                    currentLabel: 'This Week',
                    previousLabel: 'Last Week',
                    formatter: formatHoursAndMinutes,
                    percentage: calculatePercentage(weeklySummary?.currentWeek || 0, weeklySummary?.previousWeek || 0),
                    isLess: (weeklySummary?.currentWeek || 0) < (weeklySummary?.previousWeek || 0),
                };
            case 'Monthly':
                return {
                    current: monthlySummary?.currentMonth || 0,
                    previous: monthlySummary?.previousMonth || 0,
                    currentLabel: 'This Month',
                    previousLabel: 'Last Month',
                    formatter: formatMinutesToHoursAndMinutes,
                    percentage: calculatePercentage(monthlySummary?.currentMonth || 0, monthlySummary?.previousMonth || 0),
                    isLess: (monthlySummary?.currentMonth || 0) < (monthlySummary?.previousMonth || 0),
                };
        }
    };

    if (loading && !refreshing) {
        return <Loading message="Loading dashboard..." />;
    }

    const timeData = getTimeSpentData();

    return (
        <View style={styles.container}>
            <StatusBar style="light" backgroundColor={theme.colors.primary} />
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
                }
            >
                {/* Greeting Section */}
                <View style={styles.greetingSection}>
                    <Text style={styles.greetingText}>
                        Hi, <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>!
                    </Text>
                    <Text style={styles.welcomeText}>Welcome to Effortless HRM</Text>
                </View>

                {/* Member Selector & Date Picker */}

                {teamMembers.length > 0 && (
                    <Card style={styles.memberCard}>
                        <Text style={styles.controlLabel}>
                            Viewing Data For:{' '}
                            <Text style={styles.selectedMemberText}>
                                {selectedMember?.firstName
                                    ? `${selectedMember.firstName} ${selectedMember.lastName || ''}`.trim()
                                    : selectedMember?.FullName || 'Select a member'}
                            </Text>
                        </Text>

                        <Dropdown
                            style={[styles.dropdown, isFocus && { borderColor: theme.colors.primary }]}
                            placeholderStyle={styles.placeholderStyle}
                            selectedTextStyle={styles.selectedTextStyle}
                            inputSearchStyle={styles.inputSearchStyle}
                            iconStyle={styles.iconStyle}
                            data={teamMembers.map(member => ({
                                label: member.firstName
                                    ? `${member.firstName} ${member.lastName || ''}`.trim()
                                    : member.FullName || member.email || 'Unknown',
                                value: member.id,
                            }))}
                            search
                            maxHeight={300}
                            labelField="label"
                            valueField="value"
                            placeholder={!isFocus ? 'Select member' : '...'}
                            searchPlaceholder="Search..."
                            value={selectedMember?.id}
                            onFocus={() => setIsFocus(true)}
                            onBlur={() => setIsFocus(false)}
                            onChange={item => {
                                const member = teamMembers.find(m => m.id === item.value);
                                if (member) setSelectedMember(member);
                                setIsFocus(false);
                            }}
                        />
                    </Card>
                )}

                {/* Date Picker */}
                <Card style={styles.dateCard}>
                    <Text style={styles.controlLabel}>Select Date</Text>
                    <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateButton}>
                        <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
                        <Text style={styles.dateText}>{selectedDate.toLocaleDateString()}</Text>
                    </TouchableOpacity>
                    {showDatePicker && (
                        <DateTimePicker
                            value={selectedDate}
                            mode="date"
                            display="default"
                            onChange={handleDateChange}
                        />
                    )}
                </Card>


                {/* Subscription Info - Placeholder */}
                {paymentInfo && (
                    <Card style={styles.subscriptionCard}>
                        <Text style={styles.cardTitle}>Subscription Info</Text>
                        <Text style={styles.placeholderText}>
                            💳 Subscription details (Phase 3)
                        </Text>
                    </Card>
                )}

                {/* Time Spent Card */}
                <Card style={styles.timeSpentCard}>
                    <View style={styles.timeSpentHeader}>
                        <Text style={styles.cardTitle}>Time Spent</Text>
                    </View>
                    <View style={styles.radioGroup}>
                        {['Daily', 'Weekly', 'Monthly'].map((period) => (
                            <TouchableOpacity
                                key={period}
                                style={[
                                    styles.radioButton,
                                    selectedTimeSpent === period && styles.radioButtonSelected
                                ]}
                                onPress={() => setSelectedTimeSpent(period as TimeSpentPeriod)}
                            >
                                <Text style={[
                                    styles.radioButtonText,
                                    selectedTimeSpent === period && styles.radioButtonTextSelected
                                ]}>
                                    {period}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.heroContent}>
                        <Text style={styles.heroValue}>
                            {timeData.formatter(timeData.current)}
                        </Text>
                        <View style={[
                            styles.trendBadge,
                            { backgroundColor: timeData.isLess ? '#FFE5E5' : '#E5F9E5' }
                        ]}>
                            <Ionicons
                                name={timeData.isLess ? 'trending-down' : 'trending-up'}
                                size={16}
                                color={timeData.isLess ? theme.colors.error : theme.colors.success}
                                style={{ marginRight: 4 }}
                            />
                            <Text style={[
                                styles.trendText,
                                { color: timeData.isLess ? theme.colors.error : theme.colors.success }
                            ]}>
                                {timeData.percentage.toFixed(1)}%
                            </Text>
                        </View>
                    </View>

                    <Text style={styles.comparisonFooter}>
                        vs {timeData.previousLabel}: {timeData.formatter(timeData.previous)}
                    </Text>
                </Card>

                {/* Project-wise Time Spent Table */}
                <Card style={styles.tableCard}>
                    <Text style={styles.cardTitle}>Project-wise Time Spent on All Tasks</Text>
                    {projectTasks.length > 0 ? (
                        <ScrollView style={styles.tableScrollView} nestedScrollEnabled>
                            {projectTasks.map((project, projectIndex) => (
                                <View key={projectIndex} style={styles.projectSection}>
                                    <Text style={styles.projectName}>{project.projectName}</Text>
                                    {project.tasks.map((task: any, taskIndex: number) => (
                                        <View key={taskIndex} style={styles.taskRow}>
                                            <Text style={styles.taskName}>{task.taskName}</Text>
                                            <Text style={styles.taskTime}>{formatTime(task.totalTime)}</Text>
                                        </View>
                                    ))}
                                </View>
                            ))}
                        </ScrollView>
                    ) : (
                        <View style={styles.emptyState}>
                            <Ionicons name="folder-open-outline" size={48} color={theme.colors.gray400} />
                            <Text style={styles.emptyStateText}>No project data available</Text>
                        </View>
                    )}
                </Card>

                {/* Charts Row */}
                <View style={styles.chartsRow}>
                    {/* Productivity Chart */}
                    <Card style={styles.chartCard}>
                        <Text style={styles.cardTitle}>Productivity</Text>
                        {productivityData.length > 0 ? (
                            <>
                                <PieChart
                                    data={productivityData.map((item, index) => ({
                                        name: item.name,
                                        population: item.value,
                                        color: index === 0 ? theme.colors.productive :
                                            index === 1 ? theme.colors.nonProductive :
                                                theme.colors.neutral,
                                        legendFontColor: theme.colors.textPrimary,
                                        legendFontSize: 12,
                                    }))}
                                    width={screenWidth / 2 - 40}
                                    height={180}
                                    chartConfig={{
                                        color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                                    }}
                                    accessor="population"
                                    backgroundColor="transparent"
                                    paddingLeft="0"
                                    absolute
                                />
                                <View style={styles.chartLegend}>
                                    {productivityData.map((item, index) => (
                                        <View key={index} style={styles.legendItem}>
                                            <View style={[styles.legendDot, {
                                                backgroundColor: index === 0 ? theme.colors.productive :
                                                    index === 1 ? theme.colors.nonProductive :
                                                        theme.colors.neutral
                                            }]} />
                                            <Text style={styles.legendText}>{item.name}</Text>
                                            <Text style={styles.legendValue}>{item.value}</Text>
                                        </View>
                                    ))}
                                </View>
                            </>
                        ) : (
                            <View style={styles.emptyState}>
                                <Ionicons name="pie-chart-outline" size={48} color={theme.colors.gray400} />
                                <Text style={styles.emptyStateText}>No data</Text>
                            </View>
                        )}
                    </Card>

                    {/* Task Summary Chart */}
                    <Card style={styles.chartCard}>
                        <Text style={styles.cardTitle}>Task Summary</Text>
                        {taskSummary.length > 0 ? (
                            <>
                                <PieChart
                                    data={taskSummary.map((item, index) => {
                                        const colors = ['#a8385d', '#7aa3e5', '#a27ea8', '#00fa9a'];
                                        return {
                                            name: item.name,
                                            population: item.value,
                                            color: colors[index] || theme.colors.gray500,
                                            legendFontColor: theme.colors.textPrimary,
                                            legendFontSize: 12,
                                        };
                                    })}
                                    width={screenWidth / 2 - 40}
                                    height={180}
                                    chartConfig={{
                                        color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                                    }}
                                    accessor="population"
                                    backgroundColor="transparent"
                                    paddingLeft="0"
                                    absolute
                                />
                                <View style={styles.chartLegend}>
                                    {taskSummary.map((item, index) => {
                                        const colors = ['#a8385d', '#7aa3e5', '#a27ea8', '#00fa9a'];
                                        return (
                                            <View key={index} style={styles.legendItem}>
                                                <View style={[styles.legendDot, { backgroundColor: colors[index] }]} />
                                                <Text style={styles.legendText}>{item.name}</Text>
                                                <Text style={styles.legendValue}>{item.value}</Text>
                                            </View>
                                        );
                                    })}
                                </View>
                            </>
                        ) : (
                            <View style={styles.emptyState}>
                                <Ionicons name="checkbox-outline" size={48} color={theme.colors.gray400} />
                                <Text style={styles.emptyStateText}>No data</Text>
                            </View>
                        )}
                    </Card>
                </View>

                {/* Project-wise Time on Each Task (Progress Bars) */}
                <Card style={styles.progressCard}>
                    <Text style={styles.cardTitle}>Project-wise Time on Each Task</Text>
                    {dayWorkStatus.length > 0 ? (
                        dayWorkStatus.map((project, projectIndex) => (
                            <View key={projectIndex} style={styles.progressProjectSection}>
                                <Text style={styles.projectName}>{project.projectName}</Text>
                                {project.tasks.map((task: any, taskIndex: number) => {
                                    const timeInMinutes = task.count * 10;
                                    const hours = Math.floor(timeInMinutes / 60);
                                    const minutes = timeInMinutes % 60;
                                    const percentage = (timeInMinutes / (24 * 60)) * 100;

                                    return (
                                        <View key={taskIndex} style={styles.progressTaskRow}>
                                            <View style={styles.progressTaskHeader}>
                                                <Text style={styles.progressTaskName}>{task.taskName}</Text>
                                                <Text style={styles.progressTaskTime}>
                                                    {hours}h {minutes}m
                                                </Text>
                                            </View>
                                            <View style={styles.progressBarContainer}>
                                                <View
                                                    style={[
                                                        styles.progressBar,
                                                        { width: `${Math.min(percentage, 100)}%` }
                                                    ]}
                                                />
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <Ionicons name="bar-chart-outline" size={48} color={theme.colors.gray400} />
                            <Text style={styles.emptyStateText}>No progress data available</Text>
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
    greetingSection: {
        marginBottom: theme.spacing.lg,
    },
    greetingText: {
        fontSize: theme.typography.fontSize.xxl,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.textPrimary,
    },
    userName: {
        color: theme.colors.primary,
    },
    welcomeText: {
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.xs,
    },
    controlsRow: {
        flexDirection: 'column',
        marginBottom: theme.spacing.md,
    },
    memberCard: {
        marginBottom: theme.spacing.sm,
    },
    dateCard: {
        marginBottom: theme.spacing.md,
    },
    controlLabel: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.xs,
    },
    selectedMemberText: {
        color: theme.colors.primary,
        fontWeight: theme.typography.fontWeight.bold,
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.sm,
        backgroundColor: theme.colors.backgroundSecondary,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.gray300,
    },
    dateText: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.textPrimary,
        marginLeft: theme.spacing.xs,
    },
    subscriptionCard: {
        marginBottom: theme.spacing.md,
    },
    timeSpentCard: {
        marginBottom: theme.spacing.md,
    },
    timeSpentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.xs,
    },
    cardTitle: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.textPrimary,
        marginBottom: 0,
    },
    radioGroup: {
        flexDirection: 'row',
        backgroundColor: theme.colors.gray100,
        borderRadius: theme.borderRadius.md,
        padding: 4,
        marginBottom: theme.spacing.md,
    },
    radioButton: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: theme.borderRadius.sm,
    },
    radioButtonSelected: {
        backgroundColor: theme.colors.white,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.20,
        shadowRadius: 1.41,
        elevation: 2,
    },
    radioButtonText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.textSecondary,
        fontWeight: theme.typography.fontWeight.medium,
    },
    radioButtonTextSelected: {
        color: theme.colors.primary,
        fontWeight: theme.typography.fontWeight.bold,
    },
    fullWidthPickerContainer: {
        borderWidth: 1,
        borderColor: theme.colors.gray300,
        borderRadius: theme.borderRadius.sm,
        backgroundColor: theme.colors.white,
    },
    fullWidthPicker: {
        height: 50,
    },
    heroContent: {
        alignItems: 'center',
        marginVertical: theme.spacing.md,
    },
    heroValue: {
        fontSize: 42,
        fontWeight: 'bold',
        color: theme.colors.primary,
        letterSpacing: -1,
        marginBottom: theme.spacing.xs,
    },
    trendBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    trendText: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: 'bold',
    },
    comparisonFooter: {
        textAlign: 'center',
        color: theme.colors.textSecondary,
        fontSize: theme.typography.fontSize.sm,
        marginTop: theme.spacing.xs,
    },
    tableCard: {
        marginBottom: theme.spacing.md,
    },
    tableScrollView: {
        maxHeight: 300,
    },
    projectSection: {
        marginBottom: theme.spacing.md,
    },
    projectName: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing.xs,
        backgroundColor: theme.colors.gray100,
        padding: theme.spacing.sm,
        borderRadius: theme.borderRadius.sm,
    },
    taskRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray200,
    },
    taskName: {
        flex: 1,
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.textPrimary,
    },
    taskTime: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.primary,
    },
    chartsRow: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
        marginBottom: theme.spacing.md,
    },
    chartCard: {
        flex: 1,
        alignItems: 'center',
    },
    chartLegend: {
        width: '100%',
        marginTop: theme.spacing.sm,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: theme.spacing.xs,
    },
    legendDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: theme.spacing.xs,
    },
    legendText: {
        flex: 1,
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.textPrimary,
    },
    legendValue: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.textPrimary,
    },
    progressCard: {
        marginBottom: theme.spacing.md,
    },
    progressProjectSection: {
        marginBottom: theme.spacing.md,
    },
    progressTaskRow: {
        marginVertical: theme.spacing.sm,
    },
    progressTaskHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.xs,
    },
    progressTaskName: {
        flex: 1,
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.textPrimary,
    },
    progressTaskTime: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.primary,
    },
    progressBarContainer: {
        height: 8,
        backgroundColor: theme.colors.gray200,
        borderRadius: theme.borderRadius.sm,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: theme.colors.primary,
        borderRadius: theme.borderRadius.sm,
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
    placeholderText: {
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.textSecondary,
        textAlign: 'center',
    },

    dropdown: {
        height: 50,
        borderColor: theme.colors.gray300,
        borderWidth: 1,
        borderRadius: theme.borderRadius.sm,
        paddingHorizontal: 10,
        backgroundColor: theme.colors.white,
    },
    placeholderStyle: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.textSecondary,
    },
    selectedTextStyle: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.textPrimary,
    },
    iconStyle: {
        width: 20,
        height: 20,
    },
    inputSearchStyle: {
        height: 40,
        fontSize: theme.typography.fontSize.sm,
    },
});
