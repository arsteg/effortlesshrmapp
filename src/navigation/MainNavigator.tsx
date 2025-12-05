import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { CustomDrawerContent } from './CustomDrawerContent';
import { useAppSelector } from '../store/hooks';
import { theme } from '../theme';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { TaskScreen } from '../screens/tasks/TaskScreen';
import { AttendanceScreen } from '../screens/attendance/AttendanceScreen';
import TimesheetScreen from '../screens/projects/TimesheetScreen';
import { LeaveReportScreen } from '../screens/leaves/LeaveReportScreen';
import { ExpenseScreen } from '../screens/expenses/ExpenseScreen';
import ManualTimeScreen from '../screens/manualTime/ManualTimeScreen';
import EmployeesScreen from '../screens/employee/EmployeesScreen';
import ProjectsScreen from '../screens/projects/ProjectsScreen';
import TeamMembersScreen from '../screens/projects/TeamMembersScreen';
import ScreenshotScreen from '../screens/reports/ScreenshotScreen';
import { ApplyLeaveScreen } from '../screens/leaves/ApplyLeaveScreen';
import { AddExpenseScreen } from '../screens/expenses/AddExpenseScreen';
import { PayslipScreen } from '../screens/payroll/PayslipScreen';

// Import all screens

const Drawer = createDrawerNavigator();

const MainNavigator = () => {
    const isAdminPortal = useAppSelector((state) => state.auth.user?.isAdmin);

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
                component={DashboardScreen}
                options={{
                    drawerIcon: ({ color, size }) => (
                        <Ionicons name="grid-outline" size={size} color={color} />
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
                        name="Attendance"
                        component={AttendanceScreen}
                        options={{
                            drawerIcon: ({ color, size }) => (
                                <Ionicons name="time-outline" size={size} color={color} />
                            ),
                        }}
                    />

                    <Drawer.Screen
                        name="Timesheets"
                        component={TimesheetScreen}
                        options={{
                            drawerIcon: ({ color, size }) => (
                                <Ionicons name="time-outline" size={size} color={color} />
                            ),
                        }}
                    />

                    <Drawer.Screen
                        name="Leaves"
                        component={LeaveReportScreen}
                        options={{
                            drawerIcon: ({ color, size }) => (
                                <Ionicons name="calendar-outline" size={size} color={color} />
                            ),
                        }}
                    />

                    <Drawer.Screen
                        name="ApplyLeave"
                        component={ApplyLeaveScreen}
                        options={{
                            drawerLabel: 'Apply Leave',
                            drawerIcon: ({ color, size }) => (
                                <Ionicons name="add-circle-outline" size={size} color={color} />
                            ),
                            drawerItemStyle: { display: 'none' } // Hidden from direct menu, access via FAB
                        }}
                    />

                    <Drawer.Screen
                        name="Expenses"
                        component={ExpenseScreen}
                        options={{
                            drawerIcon: ({ color, size }) => (
                                <Ionicons name="wallet-outline" size={size} color={color} />
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
                        name="Payslips"
                        component={PayslipScreen}
                        options={{
                            drawerIcon: ({ color, size }) => (
                                <Ionicons name="document-text-outline" size={size} color={color} />
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
                        name="Projects"
                        component={ProjectsScreen}
                        options={{
                            drawerIcon: ({ color, size }) => (
                                <Ionicons name="briefcase-outline" size={size} color={color} />
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
                        name="Admin Attendance"
                        component={AttendanceScreen}
                        options={{
                            drawerIcon: ({ color, size }) => (
                                <Ionicons name="calendar-number-outline" size={size} color={color} />
                            ),
                            title: 'Attendance',
                        }}
                    />

                    <Drawer.Screen
                        name="Admin Timesheets"
                        component={TimesheetScreen}
                        options={{
                            drawerIcon: ({ color, size }) => (
                                <Ionicons name="timer-outline" size={size} color={color} />
                            ),
                            title: 'Timesheets',
                        }}
                    />
                </>
            )}

            <Drawer.Screen
                name="Screenshots"
                component={ScreenshotScreen}
                options={{
                    drawerIcon: ({ color, size }) => (
                        <Ionicons name="camera-outline" size={size} color={color} />
                    ),
                }}
            />
        </Drawer.Navigator>
    );
};

export default MainNavigator;
