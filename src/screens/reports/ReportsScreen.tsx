import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '../../store/hooks';
import { theme } from '../../theme';
import DateTimePicker from '@react-native-community/datetimepicker';
import { timesheetService } from '../../services/timesheetService';
import { projectService } from '../../services/projectService';
import { Dropdown } from 'react-native-element-dropdown';

// --- Types & Interfaces ---

interface TabProps {
    label: string;
    isActive: boolean;
    onPress: () => void;
}

const Tab = ({ label, isActive, onPress }: TabProps) => (
    <TouchableOpacity
        style={[styles.tab, isActive && styles.activeTab]}
        onPress={onPress}
    >
        <Text style={[styles.tabText, isActive && styles.activeTabText]}>
            {label}
        </Text>
    </TouchableOpacity>
);

const REPORTS_TABS_USER = [
    { id: 3, label: 'Timeline' },
    { id: 6, label: 'Browser History' },
    { id: 7, label: 'Apps & Websites' },
    { id: 8, label: 'Productivity' },
    { id: 10, label: 'Timesheets' },
];

const REPORTS_TABS_ADMIN = [
    { id: 1, label: 'Timeline' },
    { id: 2, label: 'Browser History' },
    { id: 3, label: 'Apps & Websites' },
    { id: 4, label: 'Productivity' },
    { id: 7, label: 'Timesheets' },
];

const ReportsScreen = () => {
    const { user, isAdminPortal } = useAppSelector((state) => state.auth);
    const [selectedTab, setSelectedTab] = useState(isAdminPortal ? 7 : 10); // Default to Timesheets
    const [isLoading, setIsLoading] = useState(false);
    const [timesheetData, setTimesheetData] = useState<any>(null);

    // Filters
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(null);

    // Admin Specific
    const [teamMembers, setTeamMembers] = useState<any[]>([]);
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [selectedUser, setSelectedUser] = useState<string>(''); // For Dropdown (single select for now to simplify)
    const [projectMap, setProjectMap] = useState<Record<string, string>>({});

    // Debug state
    const [debugInfo, setDebugInfo] = useState<string>('Loading projects...');

    useEffect(() => {
        // Reset tab when portal changes
        setSelectedTab(isAdminPortal ? 7 : 10);

        loadProjects();

        if (isAdminPortal) {
            loadTeamMembers();
        }
    }, [isAdminPortal]);

    useEffect(() => {
        if (isAdminPortal) {
            if (selectedUser) {
                fetchTimesheetData();
            }
        } else {
            fetchTimesheetData();
        }
    }, [selectedTab, startDate, endDate, selectedUser, isAdminPortal]);

    const loadTeamMembers = async () => {
        if (!user?.id) return;
        try {
            // 1. Get Subordinate IDs
            const res = await timesheetService.getSubordinates(user.id);
            const subordinateIds = Array.isArray(res) ? res : (res.data || []);

            let members = [];

            // 2. Get User Details if there are subordinates
            if (subordinateIds.length > 0) {
                const usersRes = await timesheetService.getUsersByIds(subordinateIds);
                members = Array.isArray(usersRes) ? usersRes : (usersRes.data || []);
            }

            // Add "Me" (current admin user) to the list as well if not present
            const currentUserOption = { label: 'Me', value: user.id };

            // Map to dropdown format
            const formattedMembers = members.map((m: any) => ({
                label: m.firstName ? `${m.firstName} ${m.lastName || ''}` : m.email,
                value: m.id
            })).filter((m: any) => m.value !== user.id); // Exclude self if returned by API

            const finalMembers = [currentUserOption, ...formattedMembers];

            setTeamMembers(finalMembers);

            if (finalMembers.length > 0) {
                setSelectedUser(finalMembers[0].value);
            }
        } catch (error) {
            console.error('Failed to load team members', error);
            // Fallback to just "Me" if error
            const currentUserOption = { label: 'Me', value: user.id };
            setTeamMembers([currentUserOption]);
            setSelectedUser(user.id);
        }
    };

    const loadProjects = async () => {
        try {
            const res = await projectService.getProjects();
            // Handle various response parsing scenarios
            const projects = res?.data?.projectList || res?.projectList || [];

            const map: Record<string, string> = {};
            let debugLog = `Projects found: ${projects.length}. `;

            if (projects.length > 0) {
                debugLog += `First Project Keys: ${Object.keys(projects[0]).join(', ')}. `;
            }

            projects.forEach((p: any) => {
                const id = p.id || p.Id || p._id;
                const name = p.projectName || p.ProjectName || p.name || p.Name;

                if (id) {
                    const cleanId = id.toString().trim();
                    const lowerId = cleanId.toLowerCase();
                    map[cleanId] = name;
                    map[lowerId] = name;
                }
            });
            setProjectMap(map);
            setDebugInfo(debugLog);
        } catch (error: any) {
            console.error('Failed to load projects', error);
            setDebugInfo(`Error loading projects: ${error.message}`);
        }
    };

    const fetchTimesheetData = async () => {
        if (!user?.id) return;
        const isTimesheetTab = (isAdminPortal && selectedTab === 7) || (!isAdminPortal && selectedTab === 10);

        if (!isTimesheetTab) return;

        setIsLoading(true);
        try {
            // Ensure dates are formatted correctly (Start of day / End of day if needed)
            // Angular sends: "yyyy-MM-ddT00:00:00.000+00:00"
            const startStr = startDate.toISOString().split('T')[0] + 'T00:00:00.000Z';
            const endStr = endDate.toISOString().split('T')[0] + 'T00:00:00.000Z';

            let res;
            if (isAdminPortal) {
                if (!selectedUser) {
                    setIsLoading(false);
                    return;
                }
                res = await timesheetService.getAdminTimeSheet(selectedUser, startStr, endStr);
            } else {
                res = await timesheetService.getUserTimeSheet(user.id, startStr, endStr);
            }

            setTimesheetData(res);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to fetch report');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        const type = showDatePicker;
        setShowDatePicker(null);
        if (selectedDate && type) {
            if (type === 'start') setStartDate(selectedDate);
            else setEndDate(selectedDate);
        }
    };

    const renderTabs = () => {
        const tabs = isAdminPortal ? REPORTS_TABS_ADMIN : REPORTS_TABS_USER;
        return (
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.tabContainer}
                contentContainerStyle={styles.tabContentContainer}
            >
                {tabs.map((tab) => (
                    <Tab
                        key={tab.id}
                        label={tab.label}
                        isActive={selectedTab === tab.id}
                        onPress={() => setSelectedTab(tab.id)}
                    />
                ))}
            </ScrollView>
        );
    };

    // Helper to format milliseconds to HH:mm
    const milliSecondsToTime = (milliseconds: any) => {
        if (!milliseconds) return '00:00';
        const ms = Number(milliseconds);
        if (isNaN(ms)) return '00:00';

        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);

        const pad = (num: number) => num.toString().padStart(2, '0');
        return `${pad(hours)}:${pad(minutes)}`;
    };

    const renderTimesheetContent = () => {
        if (isLoading) {
            return <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 20 }} />;
        }

        // Data Extraction Logic
        let rows: any[] = [];
        let columns: any[] = [];

        const data = timesheetData?.data || timesheetData; // Handle if wrapped in data or not

        if (!data || !data.matrix) {
            return (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No records found</Text>
                </View>
            );
        }

        columns = data.columns || [];

        if (isAdminPortal) {
            // Admin: Matrix is Object { `userId`: [[proj, t1, t2...], ...] }
            if (data.matrix && !Array.isArray(data.matrix)) {
                if (selectedUser && data.matrix[selectedUser]) {
                    rows = data.matrix[selectedUser];
                }
            } else if (Array.isArray(data.matrix)) {
                rows = data.matrix;
            }
        } else {
            // User: Matrix is Array [[proj, t1, t2...], ...]
            if (Array.isArray(data.matrix)) {
                rows = data.matrix;
            }
        }

        if (rows.length === 0) {
            return (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No records found</Text>
                </View>
            );
        }

        return (
            <ScrollView horizontal style={styles.tableScroll}>
                <View>
                    <Text style={{ color: 'blue', fontSize: 10, padding: 5, backgroundColor: '#eee' }}>
                        Map Size: {Object.keys(projectMap).length}. {debugInfo}
                        First Row ID: {rows[0] ? rows[0][0] : ''}
                    </Text>
                    {/* Header Row */}
                    <View style={styles.tableRow}>
                        <View style={[styles.tableHeaderCell, { width: 150 }]}>
                            <Text style={styles.tableHeaderText}>Project</Text>
                        </View>
                        {columns.slice(isAdminPortal ? 2 : 1).map((col: string, index: number) => (
                            <View key={index} style={[styles.tableHeaderCell, { width: 80 }]}>
                                <Text style={styles.tableHeaderText}>
                                    {new Date(col).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </Text>
                            </View>
                        ))}
                        <View style={[styles.tableHeaderCell, { width: 80 }]}>
                            <Text style={styles.tableHeaderText}>Total</Text>
                        </View>
                    </View>

                    {/* Data Rows */}
                    {rows.map((row: any[], rowIndex: number) => {
                        const projectId = row[0];
                        // Robust Lookup
                        let projectName = projectId;
                        if (projectId && typeof projectId === 'string') {
                            const cleanId = projectId.trim();
                            const lowerId = cleanId.toLowerCase();
                            projectName = projectMap[cleanId] || projectMap[lowerId] || projectId;
                        } else if (projectMap[projectId]) {
                            projectName = projectMap[projectId];
                        }

                        const timeData = row.slice(1);
                        const total = timeData.reduce((acc: number, curr: any) => acc + (Number(curr) || 0), 0);

                        return (
                            <View key={rowIndex} style={styles.tableRow}>
                                <View style={[styles.tableCell, { width: 150 }]}>
                                    <Text style={styles.tableCellText} numberOfLines={1}>{projectName || 'Unknown'}</Text>
                                </View>
                                {timeData.map((cell: any, cellIndex: number) => (
                                    <View key={cellIndex} style={[styles.tableCell, { width: 80 }]}>
                                        <Text style={styles.tableCellText}>{milliSecondsToTime(cell)}</Text>
                                    </View>
                                ))}
                                <View style={[styles.tableCell, { width: 80 }]}>
                                    <Text style={[styles.tableCellText, { fontWeight: 'bold' }]}>{milliSecondsToTime(total)}</Text>
                                </View>
                            </View>
                        );
                    })}
                </View>
            </ScrollView>
        );
    };

    const renderFilters = () => (
        <View style={styles.filterContainer}>
            {isAdminPortal && (
                <View style={styles.userSelector}>
                    <Dropdown
                        style={styles.dropdown}
                        placeholderStyle={styles.placeholderStyle}
                        selectedTextStyle={styles.selectedTextStyle}
                        data={teamMembers}
                        maxHeight={300}
                        labelField="label"
                        valueField="value"
                        placeholder="Select User"
                        value={selectedUser}
                        onChange={item => {
                            setSelectedUser(item.value);
                        }}
                    />
                </View>
            )}

            <View style={styles.dateRow}>
                <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowDatePicker('start')}
                >
                    <Text style={styles.dateLabel}>Start: {startDate.toLocaleDateString()}</Text>
                    <Ionicons name="calendar-outline" size={20} color={theme.colors.gray600} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowDatePicker('end')}
                >
                    <Text style={styles.dateLabel}>End: {endDate.toLocaleDateString()}</Text>
                    <Ionicons name="calendar-outline" size={20} color={theme.colors.gray600} />
                </TouchableOpacity>
            </View>

            {showDatePicker && (
                <DateTimePicker
                    value={showDatePicker === 'start' ? startDate : endDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                />
            )}
        </View>
    );

    const isTimesheetTab = (isAdminPortal && selectedTab === 7) || (!isAdminPortal && selectedTab === 10);

    return (
        <View style={styles.container}>
            {renderTabs()}

            {isTimesheetTab ? (
                <View style={styles.content}>
                    {renderFilters()}
                    {renderTimesheetContent()}
                </View>
            ) : (
                <View style={styles.placeholderContent}>
                    <Ionicons name="construct-outline" size={50} color={theme.colors.gray400} />
                    <Text style={styles.placeholderText}>This report is coming soon.</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    tabContainer: {
        maxHeight: 50,
        backgroundColor: theme.colors.white,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray200,
    },
    tabContentContainer: {
        paddingHorizontal: 10,
        alignItems: 'center',
    },
    tab: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginHorizontal: 4,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    activeTab: {
        backgroundColor: theme.colors.primaryLight,
        borderColor: theme.colors.primary,
    },
    tabText: {
        fontSize: 14,
        color: theme.colors.gray600,
        fontWeight: '500',
    },
    activeTabText: {
        color: theme.colors.primary,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    filterContainer: {
        marginBottom: 16,
        backgroundColor: theme.colors.white,
        padding: 12,
        borderRadius: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    userSelector: {
        marginBottom: 12,
    },
    dropdown: {
        height: 50,
        borderColor: theme.colors.gray300,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 8,
    },
    placeholderStyle: {
        fontSize: 16,
        color: theme.colors.gray500,
    },
    selectedTextStyle: {
        fontSize: 16,
        color: theme.colors.gray800,
    },
    dateRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    dateButton: {
        flex: 0.48,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 10,
        borderWidth: 1,
        borderColor: theme.colors.gray300,
        borderRadius: 8,
    },
    dateLabel: {
        fontSize: 14,
        color: theme.colors.gray800,
    },
    tableScroll: {
        flex: 1,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 30,
    },
    emptyText: {
        color: theme.colors.gray500,
        fontSize: 16,
    },
    placeholderContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholderText: {
        marginTop: 10,
        fontSize: 16,
        color: theme.colors.gray500,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray200,
    },
    tableHeaderCell: {
        padding: 10,
        backgroundColor: theme.colors.gray100,
        justifyContent: 'center',
        alignItems: 'center',
        borderRightWidth: 1,
        borderRightColor: theme.colors.gray200,
    },
    tableHeaderText: {
        fontWeight: 'bold',
        color: theme.colors.gray700,
        fontSize: 12,
    },
    tableCell: {
        padding: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderRightWidth: 1,
        borderRightColor: theme.colors.gray200,
    },
    tableCellText: {
        color: theme.colors.gray800,
        fontSize: 12,
    },
});

export default ReportsScreen;
