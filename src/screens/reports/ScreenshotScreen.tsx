import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    Modal,
    Dimensions,
    Alert,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAppSelector } from '../../store/hooks';
import { Card } from '../../components/common/Card';
import { Loading } from '../../components/common/Loading';
import { theme } from '../../theme';
import { screenshotService, TimeLog } from '../../services/screenshotService';
import { Dropdown } from 'react-native-element-dropdown';
 const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface TeamMember {
    id: string;
    name: string;
    email: string;
}

interface ScreenshotData {
    id: string;
    url: string;
    timestamp: string;
    clicks?: number;
    keysPressed?: number;
    scrolls?: number;
    application?: string;
    isManualTime?: boolean;
}

const ScreenshotScreen = () => {
    const { user } = useAppSelector((state) => state.auth);
    const isAdminPortal = useAppSelector((state) => state.auth.isAdminPortal);
    const [isFocus, setIsFocus] = useState(false);

   


    // Check if user is admin based on multiple sources
    const isAdmin = React.useMemo(() => {
        if (!user) return false;

        // Check isAdmin flag
        if (user.isAdmin) return true;

        // Check isAdminPortal flag
        if (isAdminPortal) return true;

        // Check role string
        if (typeof user.role === 'string' && user.role.toLowerCase() === 'admin') {
            return true;
        }

        // Check role object
        if (typeof user.role === 'object' && user.role && (user.role as any).name) {
            return (user.role as any).name.toLowerCase() === 'admin';
        }

        return false;
    }, [user, isAdminPortal]);

    const [screenshots, setScreenshots] = useState<ScreenshotData[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<ScreenshotData | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');

    // Team member selection for admins
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
    const [showMemberPicker, setShowMemberPicker] = useState(false);

    // Single date state
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Time totals
    const [dailyHours, setDailyHours] = useState(0);
    const [dailyMinutes, setDailyMinutes] = useState(0);
    const [weeklyHours, setWeeklyHours] = useState(0);
    const [weeklyMinutes, setWeeklyMinutes] = useState(0);
    const [monthlyHours, setMonthlyHours] = useState(0);
    const [monthlyMinutes, setMonthlyMinutes] = useState(0);

    useEffect(() => {
        loadTeamMembers();
    }, []);

    useEffect(() => {
        if (selectedMember) {
            loadScreenshots();
            loadWeeklyTotal();
            loadMonthlyTotal();
        }
    }, [selectedDate, selectedMember]);

    const loadTeamMembers = async () => {
        if (!user?.id) return;

        console.log('🔍 Loading team members - User ID:', user.id, '| isAdmin:', isAdmin);

        try {
            // Add current user as "Me"
            const members: TeamMember[] = [
                { id: user.id, name: 'Me', email: user.email || '' }
            ];

            // If admin, load subordinates
            if (isAdmin) {
                console.log('👥 Admin user - fetching subordinates...');
                const response = await screenshotService.getSubordinates(user.id);
                console.log('📋 Subordinates API response:', response);

                if (response.data && response.data.length > 0) {
                    const userIds = response.data.map((sub: any) => sub.subordinateId);
                    console.log('👤 Fetching details for', userIds.length, 'subordinates');

                    const usersResponse = await screenshotService.getUsers(userIds);
                    console.log('✅ Users API response:', usersResponse);

                    if (usersResponse.data) {
                        const subordinates = usersResponse.data
                            .filter((u: any) => u.id !== user.id)
                            .map((u: any) => ({
                                id: u.id,
                                name: `${u.firstName} ${u.lastName}`,
                                email: u.email
                            }))
                            .sort((a: TeamMember, b: TeamMember) =>
                                a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
                            );

                        members.push(...subordinates);
                    }
                }
            }

            setTeamMembers(members);
            setSelectedMember(members[0]); // Default to "Me"
        } catch (error) {
            console.error('Failed to load team members:', error);
            // Fallback to just current user
            const fallbackMember = { id: user.id, name: 'Me', email: user.email || '' };
            setTeamMembers([fallbackMember]);
            setSelectedMember(fallbackMember);
        }
    };

    useEffect(() => {
        loadScreenshots();
        loadWeeklyTotal();
        loadMonthlyTotal();
    }, [selectedDate]);

    const loadScreenshots = async () => {
        if (!user?.id || !selectedMember) return;

        setLoading(true);
        try {
            const formattedDate = screenshotService.formatDateForAPI(selectedDate);
            const data = await screenshotService.getLogsWithImages(selectedMember.id, formattedDate);

            // Convert TimeLog to ScreenshotData
            const screenshotData: ScreenshotData[] = data.map((log: TimeLog) => ({
                id: log._id,
                url: log.fileString ? `data:image/jpg;base64,${log.fileString}` : '',
                timestamp: log.endTime,
                clicks: log.clicks,
                keysPressed: log.keysPressed,
                scrolls: log.scrolls,
                application: log.url,
                isManualTime: log.isManualTime
            }));

            setScreenshots(screenshotData);

            // Calculate daily total
            const dailyTotal = screenshotService.calculateTotalTime(data);
            setDailyHours(dailyTotal.hours);
            setDailyMinutes(dailyTotal.minutes);
        } catch (error: any) {
            console.error('Failed to load screenshots:', error);
            Alert.alert('Error', 'Failed to load screenshots. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const loadWeeklyTotal = async () => {
        if (!user?.id || !selectedMember) return;

        try {
            const monday = screenshotService.getMonday(selectedDate);
            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);

            const startDate = screenshotService.formatDateForAPI(monday);
            const endDate = screenshotService.formatDateForAPI(sunday);

            const data = await screenshotService.getCurrentWeekTotalTime(selectedMember.id, startDate, endDate);
            const weeklyTotal = screenshotService.calculateTotalTime(data);
            setWeeklyHours(weeklyTotal.hours);
            setWeeklyMinutes(weeklyTotal.minutes);
        } catch (error) {
            console.error('Failed to load weekly total:', error);
        }
    };

    const loadMonthlyTotal = async () => {
        if (!user?.id || !selectedMember) return;

        try {
            const firstDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
            const lastDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

            const startDate = screenshotService.formatDateForAPI(firstDay);
            const endDate = screenshotService.formatDateForAPI(lastDay);

            const data = await screenshotService.getCurrentWeekTotalTime(selectedMember.id, startDate, endDate);
            const monthlyTotal = screenshotService.calculateTotalTime(data);
            setMonthlyHours(monthlyTotal.hours);
            setMonthlyMinutes(monthlyTotal.minutes);
        } catch (error) {
            console.error('Failed to load monthly total:', error);
        }
    };

    const handleDeleteScreenshot = async (screenshotId: string) => {
        Alert.alert(
            'Delete Screenshot',
            'Are you sure you want to delete this screenshot?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await screenshotService.deleteScreenshot(screenshotId);
                            setScreenshots(prev => prev.filter(s => s.id !== screenshotId));
                            setSelectedImage(null);
                            Alert.alert('Success', 'Screenshot deleted successfully');
                            loadScreenshots(); // Reload to update totals
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete screenshot');
                        }
                    },
                },
            ]
        );
    };

    const handlePreviousDay = () => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() - 1);
        setSelectedDate(newDate);
    };

    const handleNextDay = () => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + 1);
        setSelectedDate(newDate);
    };

    const isToday = () => {
        const today = new Date();
        return selectedDate.toDateString() === today.toDateString();
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const renderGridItem = ({ item }: { item: ScreenshotData }) => (
        <TouchableOpacity
            style={styles.gridItem}
            onPress={() => setSelectedImage(item)}
        >
            {item.isManualTime ? (
                <View style={styles.manualTimeContainer}>
                    <Ionicons name="time-outline" size={48} color={theme.colors.primary} />
                    <Text style={styles.manualTimeText}>Manual Time</Text>
                </View>
            ) : (
                <Image
                    source={{ uri: item.url }}
                    style={styles.thumbnail}
                    resizeMode="cover"
                />
            )}
            <View style={styles.gridItemOverlay}>
                <Text style={styles.gridItemTime}>{formatTime(item.timestamp)}</Text>
                {!item.isManualTime && (
                    <View style={styles.activityInfo}>
                        {item.clicks !== undefined && (
                            <Text style={styles.activityText}>C:{item.clicks}</Text>
                        )}
                        {item.keysPressed !== undefined && (
                            <Text style={styles.activityText}>K:{item.keysPressed}</Text>
                        )}
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );

    const renderTimelineItem = ({ item }: { item: ScreenshotData }) => (
        <Card style={styles.timelineItem}>
            <View style={styles.timelineHeader}>
                <Text style={styles.timelineTime}>{formatTime(item.timestamp)}</Text>
                <Text style={styles.timelineDate}>{formatDate(item.timestamp)}</Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedImage(item)}>
                {item.isManualTime ? (
                    <View style={styles.manualTimeTimelineContainer}>
                        <Ionicons name="time-outline" size={64} color={theme.colors.primary} />
                        <Text style={styles.manualTimeText}>Manual Time Entry</Text>
                    </View>
                ) : (
                    <Image
                        source={{ uri: item.url }}
                        style={styles.timelineImage}
                        resizeMode="cover"
                    />
                )}
            </TouchableOpacity>
            {!item.isManualTime && (
                <View style={styles.timelineFooter}>
                    {item.application && (
                        <>
                            <Ionicons name="desktop-outline" size={16} color={theme.colors.gray600} />
                            <Text style={styles.applicationText}>{item.application}</Text>
                        </>
                    )}
                    <View style={styles.activityStats}>
                        {item.clicks !== undefined && (
                            <Text style={styles.statText}>Clicks: {item.clicks}</Text>
                        )}
                        {item.keysPressed !== undefined && (
                            <Text style={styles.statText}>Keys: {item.keysPressed}</Text>
                        )}
                        {item.scrolls !== undefined && (
                            <Text style={styles.statText}>Scrolls: {item.scrolls}</Text>
                        )}
                    </View>
                </View>
            )}
        </Card>
    );

    if (loading && screenshots.length === 0) {
        return <Loading message="Loading screenshots..." />;
    }

    return (
        <View style={styles.container}>
            <StatusBar style="light" backgroundColor={theme.colors.primary} />

            {/* Header Controls */}
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <Text style={styles.title}>Screenshots</Text>
                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() => setViewMode(viewMode === 'grid' ? 'timeline' : 'grid')}
                        >
                            <Ionicons
                                name={viewMode === 'grid' ? 'list' : 'grid'}
                                size={24}
                                color={theme.colors.primary}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Team Member Selection (Admin Only) */}
                {/* {isAdmin && (
                    <View style={styles.memberSelector}>
                        <Text style={styles.memberLabel}>Team Member:</Text>
                        <TouchableOpacity
                            style={styles.memberButton}
                            onPress={() => setShowMemberPicker(true)}
                        >
                            <Text style={styles.memberButtonText}>
                                {selectedMember?.name || 'Select Member'}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color={theme.colors.primary} />
                        </TouchableOpacity>
                    </View>
                )} */}

  {isAdmin  && (
                    <Card style={styles.memberCard}>
                        <Text style={styles.controlLabel}>
                            Viewing Data For:{' '}
                            <Text style={styles.selectedMemberText}>
                                {selectedMember?.name
                                    || 'Select a member'}
                            </Text>
                        </Text>

                        <Dropdown
                            style={[styles.dropdown, isFocus && { borderColor: theme.colors.primary }]}
                            placeholderStyle={styles.placeholderStyle}
                            selectedTextStyle={styles.selectedTextStyle}
                            inputSearchStyle={styles.inputSearchStyle}
                            iconStyle={styles.iconStyle}
                            data={teamMembers.map(member => ({
                                label: member.name,
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

                {/* Date Navigation */}
                <View style={styles.dateNavigation}>
                    <TouchableOpacity
                        style={styles.navButton}
                        onPress={handlePreviousDay}
                    >
                        <Ionicons name="chevron-back" size={24} color={theme.colors.primary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.dateButton}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
                        <Text style={styles.dateText}>
                            {selectedDate.toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                            })}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.navButton, isToday() && styles.navButtonDisabled]}
                        onPress={handleNextDay}
                        disabled={isToday()}
                    >
                        <Ionicons
                            name="chevron-forward"
                            size={24}
                            color={isToday() ? theme.colors.gray400 : theme.colors.primary}
                        />
                    </TouchableOpacity>
                </View>

                {/* Time Totals */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.totalsContainer}>
                    <Card style={styles.totalCard}>
                        <Text style={styles.totalLabel}>Today</Text>
                        <Text style={styles.totalValue}>
                            {dailyHours}h {dailyMinutes}m
                        </Text>
                    </Card>
                    <Card style={styles.totalCard}>
                        <Text style={styles.totalLabel}>This Week</Text>
                        <Text style={styles.totalValue}>
                            {weeklyHours}h {weeklyMinutes}m
                        </Text>
                    </Card>
                    <Card style={styles.totalCard}>
                        <Text style={styles.totalLabel}>This Month</Text>
                        <Text style={styles.totalValue}>
                            {monthlyHours}h {monthlyMinutes}m
                        </Text>
                    </Card>
                </ScrollView>

                {/* Stats */}
                <View style={styles.statsRow}>
                    <Text style={styles.statsText}>
                        {screenshots.length} screenshot{screenshots.length !== 1 ? 's' : ''}
                    </Text>
                    {loading && <ActivityIndicator size="small" color={theme.colors.primary} />}
                </View>
            </View>

            {/* Screenshot List */}
            {screenshots.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="camera-outline" size={64} color={theme.colors.gray400} />
                    <Text style={styles.emptyStateTitle}>No Screenshots</Text>
                    <Text style={styles.emptyStateText}>
                        No screenshots found for {selectedDate.toLocaleDateString()}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={screenshots}
                    renderItem={viewMode === 'grid' ? renderGridItem : renderTimelineItem}
                    keyExtractor={(item) => item.id}
                    numColumns={viewMode === 'grid' ? 2 : 1}
                    key={viewMode}
                    contentContainerStyle={styles.listContent}
                    refreshing={loading}
                    onRefresh={loadScreenshots}
                />
            )}

            {/* Full Screen Image Modal */}
            <Modal
                visible={!!selectedImage}
                transparent
                animationType="fade"
                onRequestClose={() => setSelectedImage(null)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>
                            {selectedImage && formatDate(selectedImage.timestamp)} at {selectedImage && formatTime(selectedImage.timestamp)}
                        </Text>
                        <View style={styles.modalActions}>
                            {isAdmin && (
                                <TouchableOpacity
                                    style={styles.modalButton}
                                    onPress={() => selectedImage && handleDeleteScreenshot(selectedImage.id)}
                                >
                                    <Ionicons name="trash-outline" size={24} color={theme.colors.error} />
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                style={styles.modalButton}
                                onPress={() => setSelectedImage(null)}
                            >
                                <Ionicons name="close" size={24} color={theme.colors.white} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {selectedImage && (
                        selectedImage.isManualTime ? (
                            <View style={styles.manualTimeModalContainer}>
                                <Ionicons name="time-outline" size={120} color={theme.colors.white} />
                                <Text style={styles.manualTimeModalText}>Manual Time Entry</Text>
                                <Text style={styles.manualTimeModalSubtext}>
                                    10 minutes logged manually
                                </Text>
                            </View>
                        ) : (
                            <Image
                                source={{ uri: selectedImage.url }}
                                style={styles.fullImage}
                                resizeMode="contain"
                            />
                        )
                    )}

                    {selectedImage && !selectedImage.isManualTime && (
                        <View style={styles.modalFooter}>
                            {selectedImage.application && (
                                <>
                                    <Ionicons name="desktop-outline" size={20} color={theme.colors.white} />
                                    <Text style={styles.modalFooterText}>{selectedImage.application}</Text>
                                </>
                            )}
                            <View style={styles.modalStats}>
                                {selectedImage.clicks !== undefined && (
                                    <Text style={styles.modalStatText}>Clicks: {selectedImage.clicks}</Text>
                                )}
                                {selectedImage.keysPressed !== undefined && (
                                    <Text style={styles.modalStatText}>Keys: {selectedImage.keysPressed}</Text>
                                )}
                                {selectedImage.scrolls !== undefined && (
                                    <Text style={styles.modalStatText}>Scrolls: {selectedImage.scrolls}</Text>
                                )}
                            </View>
                        </View>
                    )}
                </View>
            </Modal>

            {/* Date Picker */}
            {showDatePicker && (
                <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display="default"
                    onChange={(event, date) => {
                        setShowDatePicker(false);
                        if (date) setSelectedDate(date);
                    }}
                    maximumDate={new Date()}
                />
            )}

            {/* Team Member Picker Modal */}
            <Modal
                visible={showMemberPicker}
                transparent
                animationType="slide"
                onRequestClose={() => setShowMemberPicker(false)}
            >
                <View style={styles.pickerModalContainer}>
                    <View style={styles.pickerModalContent}>
                        <View style={styles.pickerHeader}>
                            <Text style={styles.pickerTitle}>Select Team Member</Text>
                            <TouchableOpacity onPress={() => setShowMemberPicker(false)}>
                                <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.pickerList}>
                            {teamMembers.map((member) => (
                                <TouchableOpacity
                                    key={member.id}
                                    style={[
                                        styles.pickerItem,
                                        selectedMember?.id === member.id && styles.pickerItemSelected
                                    ]}
                                    onPress={() => {
                                        setSelectedMember(member);
                                        setShowMemberPicker(false);
                                    }}
                                >
                                    <View>
                                        <Text style={styles.pickerItemName}>{member.name}</Text>
                                        <Text style={styles.pickerItemEmail}>{member.email}</Text>
                                    </View>
                                    {selectedMember?.id === member.id && (
                                        <Ionicons name="checkmark" size={24} color={theme.colors.primary} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.backgroundSecondary,
    },
    header: {
        backgroundColor: theme.colors.white,
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray200,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    title: {
        fontSize: theme.typography.fontSize.xl,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.textPrimary,
    },
    headerActions: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
    },
    iconButton: {
        padding: theme.spacing.xs,
    },
    dateNavigation: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: theme.spacing.sm,
        marginBottom: theme.spacing.sm,
    },
    navButton: {
        padding: theme.spacing.xs,
    },
    navButtonDisabled: {
        opacity: 0.5,
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
        padding: theme.spacing.sm,
        borderWidth: 1,
        borderColor: theme.colors.gray300,
        borderRadius: theme.borderRadius.md,
        backgroundColor: theme.colors.white,
        flex: 1,
        marginHorizontal: theme.spacing.sm,
    },
    dateText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.textPrimary,
    },
    totalsContainer: {
        marginTop: theme.spacing.sm,
        marginBottom: theme.spacing.sm,
    },
    totalCard: {
        marginRight: theme.spacing.sm,
        padding: theme.spacing.md,
        minWidth: 100,
        alignItems: 'center',
    },
    totalLabel: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.xs,
    },
    totalValue: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.primary,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: theme.spacing.sm,
    },
    statsText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.textSecondary,
    },
    listContent: {
        padding: theme.spacing.sm,
    },
    gridItem: {
        flex: 1,
        margin: theme.spacing.xs,
        aspectRatio: 1,
        borderRadius: theme.borderRadius.md,
        overflow: 'hidden',
        backgroundColor: theme.colors.gray200,
    },
    thumbnail: {
        width: '100%',
        height: '100%',
    },
    manualTimeContainer: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.gray100,
    },
    manualTimeText: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.xs,
    },
    gridItemOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: theme.spacing.xs,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    gridItemTime: {
        color: theme.colors.white,
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.medium,
    },
    activityInfo: {
        flexDirection: 'row',
        gap: theme.spacing.xs,
    },
    activityText: {
        color: theme.colors.white,
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.bold,
    },
    timelineItem: {
        marginBottom: theme.spacing.sm,
    },
    timelineHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    timelineTime: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.textPrimary,
    },
    timelineDate: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.textSecondary,
    },
    timelineImage: {
        width: '100%',
        height: 200,
        borderRadius: theme.borderRadius.md,
        backgroundColor: theme.colors.gray200,
    },
    manualTimeTimelineContainer: {
        width: '100%',
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.gray100,
        borderRadius: theme.borderRadius.md,
    },
    timelineFooter: {
        flexDirection: 'column',
        gap: theme.spacing.xs,
        marginTop: theme.spacing.sm,
    },
    applicationText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.textSecondary,
    },
    activityStats: {
        flexDirection: 'row',
        gap: theme.spacing.md,
    },
    statText: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.textSecondary,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.xl,
    },
    emptyStateTitle: {
        fontSize: theme.typography.fontSize.xl,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.textPrimary,
        marginTop: theme.spacing.md,
        marginBottom: theme.spacing.xs,
    },
    emptyStateText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.textSecondary,
        textAlign: 'center',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.95)',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.md,
        backgroundColor: 'rgba(0,0,0,0.8)',
    },
    modalTitle: {
        flex: 1,
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.white,
        fontWeight: theme.typography.fontWeight.medium,
    },
    modalActions: {
        flexDirection: 'row',
        gap: theme.spacing.md,
    },
    modalButton: {
        padding: theme.spacing.xs,
    },
    fullImage: {
        flex: 1,
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT - 120,
    },
    manualTimeModalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    manualTimeModalText: {
        fontSize: theme.typography.fontSize.xl,
        color: theme.colors.white,
        fontWeight: theme.typography.fontWeight.bold,
        marginTop: theme.spacing.md,
    },
    manualTimeModalSubtext: {
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.gray400,
        marginTop: theme.spacing.sm,
    },
    modalFooter: {
        flexDirection: 'column',
        gap: theme.spacing.sm,
        padding: theme.spacing.md,
        backgroundColor: 'rgba(0,0,0,0.8)',
    },
    modalFooterText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.white,
    },
    modalStats: {
        flexDirection: 'row',
        gap: theme.spacing.md,
    },
    modalStatText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.white,
    },
    // Team member selector styles
    memberSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: theme.spacing.sm,
        marginBottom: theme.spacing.sm,
    },
    memberLabel: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.textSecondary,
        marginRight: theme.spacing.sm,
    },
    memberButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing.sm,
        borderWidth: 1,
        borderColor: theme.colors.gray300,
        borderRadius: theme.borderRadius.md,
        backgroundColor: theme.colors.white,
    },
    memberButtonText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.textPrimary,
    },
    // Picker modal styles
    pickerModalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    pickerModalContent: {
        backgroundColor: theme.colors.white,
        borderTopLeftRadius: theme.borderRadius.lg,
        borderTopRightRadius: theme.borderRadius.lg,
        maxHeight: '70%',
    },
    pickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray200,
    },
    pickerTitle: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.textPrimary,
    },
    pickerList: {
        maxHeight: 400,
    },
    pickerItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray100,
    },
    pickerItemSelected: {
        backgroundColor: theme.colors.gray50,
    },
    pickerItemName: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing.xs,
    },
    pickerItemEmail: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.textSecondary,
    },
     memberCard: {
        marginBottom: theme.spacing.sm,
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

export default ScreenshotScreen;
