import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { CustomDrawerContent } from './CustomDrawerContent';
import { useAppSelector } from '../store/hooks';
import { theme } from '../theme';
import { UserDashboardScreen } from '../screens/dashboard/UserDashboardScreen';
import { AdminDashboardScreen } from '../screens/dashboard/AdminDashboardScreen';
import { TaskScreen } from '../screens/tasks/TaskScreen';
import AttendanceScreen from '../screens/attendance/AttendanceScreen';
import TimesheetScreen from '../screens/projects/TimesheetScreen';
import { LeaveReportScreen } from '../screens/leaves/LeaveReportScreen';
import { ExpenseScreen } from '../screens/expenses/ExpenseScreen';
import ManualTimeScreen from '../screens/manualTime/ManualTimeScreen';
import ApprovalScreen from '../screens/approvals/ApprovalScreen';
import EmployeesScreen from '../screens/employee/EmployeesScreen';
import ProjectsScreen from '../screens/projects/ProjectsScreen';
import TeamMembersScreen from '../screens/projects/TeamMembersScreen';
import ScreenshotScreen from '../screens/reports/ScreenshotScreen';
import { ApplyLeaveScreen } from '../screens/leaves/ApplyLeaveScreen';
import { AddExpenseScreen } from '../screens/expenses/AddExpenseScreen';
import { PayslipScreen } from '../screens/payroll/PayslipScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { ChangePasswordScreen } from '../screens/profile/ChangePasswordScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { HelpScreen } from '../screens/support/HelpScreen';
import RealTimeScreen from '../screens/reports/RealTimeScreen';
import LiveScreen from '../screens/reports/LiveScreen';
import ReportsScreen from '../screens/reports/ReportsScreen';
import LeaveApplicationScreen from '../screens/leaves/LeaveApplicationScreen';
import AttendanceSettingsScreen from '../screens/attendance/AttendanceSettingsScreen';
import ManualAttendanceScreen from '../screens/attendance/ManualAttendanceScreen';
import AttendanceReportScreen from '../screens/attendance/AttendanceReportScreen';

// Import all screens

const Drawer = createDrawerNavigator();

const MainNavigator = () => {
    const isAdminPortal = useAppSelector((state) => state.auth.isAdminPortal);

    // Select dashboard component based on role
    const DashboardComponent = isAdminPortal ? AdminDashboardScreen : UserDashboardScreen;

    return (
        <Drawer.Navigator
            drawerContent={(props) => <CustomDrawerContent {...props} />}
            screenOptions={{
                headerStyle: { backgroundColor: theme.colors.primary },
                headerTintColor: theme.colors.white,
                headerTitleStyle: { fontWeight: 'bold' },
                drawerActiveTintColor: theme.colors.primary,
                drawerInactiveTintColor: theme.colors.gray600,
            }}
        >
            <Drawer.Screen
                name="Dashboard"
                component={DashboardComponent}
                options={{
                    drawerIcon: ({ color, size }) => (
                        <Ionicons name="grid-outline" size={size} color={color} />
                    ),
                }}
            />

            <Drawer.Screen
                name="Screenshots"
                component={ScreenshotScreen}
                options={{
                    drawerIcon: ({ color, size }) => (
                        <Ionicons name="camera-outline" size={size} color={color} />
                    ),
                }}
            />


            {/* Non-admin screens */}
            {!isAdminPortal && (
                <>
                    <Drawer.Screen
                        name="Tasks"
                        component={TaskScreen}
                        options={{
                            drawerIcon: ({ color, size }) => (
                                <Ionicons name="checkbox-outline" size={size} color={color} />
                            ),
                        }}
                    />
                    <Drawer.Screen
                        name="Reports"
                        component={ReportsScreen}
                        options={{
                            drawerIcon: ({ color, size }) => (
                                <Ionicons name="bar-chart-outline" size={size} color={color} />
                            ),
                        }}
                    />
                    <Drawer.Screen
                        name="Leaves"
                        component={LeaveApplicationScreen}
                        options={{
                            drawerIcon: ({ color, size }) => (
                                <Ionicons name="calendar-outline" size={size} color={color} />
                            ),
                        }}
                    />
                    <Drawer.Screen
                        name="Payslips"
                        component={PayslipScreen}
                        options={{
                            drawerIcon: ({ color, size }) => (
                                <Ionicons name="document-text-outline" size={size} color={color} />
                            ),
                        }}
                    />
                    <Drawer.Screen
                        name="Attendance"
                        component={AttendanceScreen}
                        options={{
                            drawerIcon: ({ color, size }) => (
                                <Ionicons name="time-outline" size={size} color={color} />
                            ),
                        }}
                    />
                    <Drawer.Screen
                        name="Manual Time"
                        component={ManualTimeScreen}
                        options={{
                            drawerIcon: ({ color, size }) => (
                                <Ionicons name="watch-outline" size={size} color={color} />
                            ),
                        }}
                    />
                </>
            )}

            {/* Admin screens */}
            {isAdminPortal && (
                <>
                    <Drawer.Screen
                        name="Manage Employees"
                        component={EmployeesScreen}
                        options={{
                            drawerIcon: ({ color, size }) => (
                                <Ionicons name="people-outline" size={size} color={color} />
                            ),
                        }}
                    />
                    <Drawer.Screen
                        name="Team Tasks"
                        component={TaskScreen}
                        options={{
                            drawerIcon: ({ color, size }) => (
                                <Ionicons name="list-outline" size={size} color={color} />
                            ),
                            title: 'Tasks',
                        }}
                    />
                    <Drawer.Screen
                        name="Team Members"
                        component={TeamMembersScreen}
                        options={{
                            drawerIcon: ({ color, size }) => (
                                <Ionicons name="person-add-outline" size={size} color={color} />
                            ),
                        }}
                    />
                    <Drawer.Screen
                        name="Leave Application"
                        component={LeaveApplicationScreen}
                        options={{
                            drawerIcon: ({ color, size }) => (
                                <Ionicons name="document-text-outline" size={size} color={color} />
                            ),
                        }}
                    />
                    <Drawer.Screen
                        name="Reports"
                        component={ReportsScreen}
                        options={{
                            drawerIcon: ({ color, size }) => (
                                <Ionicons name="bar-chart-outline" size={size} color={color} />
                            ),
                            title: 'Reports',
                        }}
                    />
                    <Drawer.Screen
                        name="Real Time"
                        component={RealTimeScreen}
                        options={{
                            drawerIcon: ({ color, size }) => (
                                <Ionicons name="pulse-outline" size={size} color={color} />
                            ),
                            title: 'RealTime',
                        }}
                    />
                    <Drawer.Screen
                        name="Attendance"
                        component={AttendanceScreen}
                        options={{
                            drawerIcon: ({ color, size }) => (
                                <Ionicons name="time-outline" size={size} color={color} />
                            ),
                        }}
                    />
                    <Drawer.Screen
                        name="Manual Time"
                        component={ManualTimeScreen}
                        options={{
                            drawerIcon: ({ color, size }) => (
                                <Ionicons name="watch-outline" size={size} color={color} />
                            ),
                        }}
                    />
                    <Drawer.Screen
                        name="Payslips"
                        component={PayslipScreen}
                        options={{
                            drawerIcon: ({ color, size }) => (
                                <Ionicons name="document-text-outline" size={size} color={color} />
                            ),
                        }}
                    />
                    <Drawer.Screen
                        name="Approvals"
                        component={ApprovalScreen}
                        options={{
                            drawerIcon: ({ color, size }) => (
                                <Ionicons name="checkmark-done-outline" size={size} color={color} />
                            ),
                        }}
                    />
                </>
            )}

            {/* Common screens for both portals */}
            <Drawer.Screen
                name="Settings"
                component={SettingsScreen}
                options={{
                    drawerIcon: ({ color, size }) => (
                        <Ionicons name="settings-outline" size={size} color={color} />
                    ),
                }}
            />
            <Drawer.Screen
                name="Help"
                component={HelpScreen}
                options={{
                    drawerIcon: ({ color, size }) => (
                        <Ionicons name="help-circle-outline" size={size} color={color} />
                    ),
                }}
            />

            {/* Hidden screens (not in drawer menu) */}
            <Drawer.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    drawerItemStyle: { display: 'none' },
                    drawerIcon: ({ color, size }) => (
                        <Ionicons name="person-outline" size={size} color={color} />
                    ),
                }}
            />
            <Drawer.Screen
                name="ChangePassword"
                component={ChangePasswordScreen}
                options={{
                    drawerItemStyle: { display: 'none' },
                    drawerIcon: ({ color, size }) => (
                        <Ionicons name="lock-closed-outline" size={size} color={color} />
                    ),
                    title: 'Change Password',
                }}
            />
            <Drawer.Screen
                name="LiveScreen"
                component={LiveScreen}
                options={{
                    drawerItemStyle: { display: 'none' },
                    title: 'Live Monitoring'
                }}
            />
            <Drawer.Screen
                name="ApplyLeave"
                component={ApplyLeaveScreen}
                options={{
                    drawerLabel: 'Apply Leave',
                    drawerItemStyle: { display: 'none' },
                    drawerIcon: ({ color, size }) => (
                        <Ionicons name="add-circle-outline" size={size} color={color} />
                    ),
                }}
            />
            <Drawer.Screen
                name="AddExpense"
                component={AddExpenseScreen}
                options={{
                    drawerLabel: 'Add Expense',
                    drawerItemStyle: { display: 'none' },
                    drawerIcon: ({ color, size }) => (
                        <Ionicons name="add-circle-outline" size={size} color={color} />
                    ),
                }}
            />
            <Drawer.Screen
                name="Office Settings"
                component={AttendanceSettingsScreen}
                options={{
                    drawerItemStyle: { display: 'none' },
                    title: 'Office Management',
                    headerShown: false
                }}
            />
            <Drawer.Screen
                name="Attendance Requests"
                component={ManualAttendanceScreen}
                options={{
                    drawerItemStyle: { display: 'none' },
                    title: 'Attendance Requests'
                }}
            />
            <Drawer.Screen
                name="Attendance Report"
                component={AttendanceReportScreen}
                options={{
                    drawerItemStyle: { display: 'none' },
                    title: 'Attendance Report',
                    headerShown: false
                }}
            />
        </Drawer.Navigator>
    );
};

export default MainNavigator;
