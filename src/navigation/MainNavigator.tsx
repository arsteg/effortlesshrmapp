import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { CustomDrawerContent } from './CustomDrawerContent';
import { useAppSelector } from '../store/hooks';

return (
    <Drawer.Navigator
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
            headerStyle: {
                backgroundColor: theme.colors.primary,
            },
            headerTintColor: theme.colors.white,
            headerTitleStyle: {
                fontWeight: 'bold',
            },
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

        {/* Common User Screens */}
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
                    name="Expenses"
                    component={ExpenseScreen}
                    options={{
                        drawerIcon: ({ color, size }) => (
                            <Ionicons name="wallet-outline" size={size} color={color} />
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

        {/* Admin Screens */}
        {isAdminPortal && (
            <>
                <Drawer.Screen
                    name="Manage Employees"
                    component={EmployeesScreen} // Placeholder - need to check if exists or use Task for now
                    options={{
                        drawerIcon: ({ color, size }) => (
                            <Ionicons name="people-outline" size={size} color={color} />
                        ),
                    }}
                />
                <Drawer.Screen
                    name="Projects"
                    component={ProjectsScreen} // Placeholder
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
                        title: 'Tasks'
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
                    component={AttendanceScreen} // Reusing for now
                    options={{
                        drawerIcon: ({ color, size }) => (
                            <Ionicons name="calendar-number-outline" size={size} color={color} />
                        ),
                        title: 'Attendance'
                    }}
                />
                <Drawer.Screen
                    name="Admin Timesheets"
                    component={TimesheetScreen} // Reusing for now
                    options={{
                        drawerIcon: ({ color, size }) => (
                            <Ionicons name="timer-outline" size={size} color={color} />
                        ),
                        title: 'Timesheets'
                    }}
                />
            </>
        )}

        <Drawer.Screen
            name="Screenshots"
            component={ScreenshotScreen} // Placeholder
            options={{
                drawerIcon: ({ color, size }) => (
                    <Ionicons name="camera-outline" size={size} color={color} />
                ),
            }}
        />
    </Drawer.Navigator>
);
};
