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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAppSelector } from '../../store/hooks';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Loading } from '../../components/common/Loading';
import { theme } from '../../theme';
import { screenshotService } from '../../services/screenshotService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Screenshot {
    id: string;
    url: string;
    thumbnailUrl?: string;
    timestamp: string;
    userId: string;
    userName?: string;
    application?: string;
    activityLevel?: number;
}

interface FilterOptions {
    startDate: Date;
    endDate: Date;
    userId?: string;
    application?: string;
}

const ScreenshotScreen = () => {
    const { user } = useAppSelector((state) => state.auth);
    const isAdmin = useAppSelector((state) => state.auth.isAdminPortal);

    const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
    const [filteredScreenshots, setFilteredScreenshots] = useState<Screenshot[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<Screenshot | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');

    // Filter states
    const [showFilters, setShowFilters] = useState(false);
    const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)); // Last 7 days
    const [endDate, setEndDate] = useState(new Date());
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);
    const [selectedApplication, setSelectedApplication] = useState<string>('');

    useEffect(() => {
        loadScreenshots();
    }, [startDate, endDate]);

    useEffect(() => {
        applyFilters();
    }, [screenshots, selectedApplication]);

    const loadScreenshots = async () => {
        if (!user?.id) return;

        setLoading(true);
        try {
            const data = await screenshotService.getScreenshots(
                user.id,
                startDate.toISOString(),
                endDate.toISOString()
            );
            setScreenshots(data);
        } catch (error: any) {
            console.error('Failed to load screenshots:', error);
            Alert.alert('Error', 'Failed to load screenshots. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...screenshots];

        if (selectedApplication) {
            filtered = filtered.filter(s => s.application === selectedApplication);
        }

        setFilteredScreenshots(filtered);
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
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete screenshot');
                        }
                    },
                },
            ]
        );
    };

    const getUniqueApplications = () => {
        const apps = screenshots.map(s => s.application).filter(Boolean);
        return Array.from(new Set(apps));
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const renderGridItem = ({ item }: { item: Screenshot }) => (
        <TouchableOpacity
            style={styles.gridItem}
            onPress={() => setSelectedImage(item)}
        >
            <Image
                source={{ uri: item.thumbnailUrl || item.url }}
                style={styles.thumbnail}
                resizeMode="cover"
            />
            <View style={styles.gridItemOverlay}>
                <Text style={styles.gridItemTime}>{formatTime(item.timestamp)}</Text>
                {item.activityLevel !== undefined && (
                    <View style={[
                        styles.activityBadge,
                        { backgroundColor: getActivityColor(item.activityLevel) }
                    ]}>
                        <Text style={styles.activityText}>{item.activityLevel}%</Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );

    const renderTimelineItem = ({ item }: { item: Screenshot }) => (
        <Card style={styles.timelineItem}>
            <View style={styles.timelineHeader}>
                <Text style={styles.timelineTime}>{formatTime(item.timestamp)}</Text>
                <Text style={styles.timelineDate}>{formatDate(item.timestamp)}</Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedImage(item)}>
                <Image
                    source={{ uri: item.thumbnailUrl || item.url }}
                    style={styles.timelineImage}
                    resizeMode="cover"
                />
            </TouchableOpacity>
            {item.application && (
                <View style={styles.timelineFooter}>
                    <Ionicons name="desktop-outline" size={16} color={theme.colors.gray600} />
                    <Text style={styles.applicationText}>{item.application}</Text>
                </View>
            )}
        </Card>
    );

    const getActivityColor = (level: number) => {
        if (level >= 70) return theme.colors.success;
        if (level >= 40) return theme.colors.warning;
        return theme.colors.error;
    };

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
                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() => setShowFilters(!showFilters)}
                        >
                            <Ionicons
                                name="filter"
                                size={24}
                                color={showFilters ? theme.colors.primary : theme.colors.gray600}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Filters */}
                {showFilters && (
                    <Card style={styles.filtersCard}>
                        <View style={styles.filterRow}>
                            <View style={styles.filterItem}>
                                <Text style={styles.filterLabel}>Start Date</Text>
                                <TouchableOpacity
                                    style={styles.dateButton}
                                    onPress={() => setShowStartDatePicker(true)}
                                >
                                    <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
                                    <Text style={styles.dateText}>{startDate.toLocaleDateString()}</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.filterItem}>
                                <Text style={styles.filterLabel}>End Date</Text>
                                <TouchableOpacity
                                    style={styles.dateButton}
                                    onPress={() => setShowEndDatePicker(true)}
                                >
                                    <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
                                    <Text style={styles.dateText}>{endDate.toLocaleDateString()}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <Button
                            title="Clear Filters"
                            onPress={() => {
                                setStartDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
                                setEndDate(new Date());
                                setSelectedApplication('');
                            }}
                            variant="outline"
                            style={styles.clearButton}
                        />
                    </Card>
                )}

                {/* Stats */}
                <View style={styles.statsRow}>
                    <Text style={styles.statsText}>
                        {filteredScreenshots.length} screenshot{filteredScreenshots.length !== 1 ? 's' : ''}
                    </Text>
                    {loading && <ActivityIndicator size="small" color={theme.colors.primary} />}
                </View>
            </View>

            {/* Screenshot List */}
            {filteredScreenshots.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="camera-outline" size={64} color={theme.colors.gray400} />
                    <Text style={styles.emptyStateTitle}>No Screenshots</Text>
                    <Text style={styles.emptyStateText}>
                        No screenshots found for the selected date range
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredScreenshots}
                    renderItem={viewMode === 'grid' ? renderGridItem : renderTimelineItem}
                    keyExtractor={(item) => item.id}
                    numColumns={viewMode === 'grid' ? 2 : 1}
                    key={viewMode} // Force re-render when view mode changes
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
                        <Image
                            source={{ uri: selectedImage.url }}
                            style={styles.fullImage}
                            resizeMode="contain"
                        />
                    )}

                    {selectedImage?.application && (
                        <View style={styles.modalFooter}>
                            <Ionicons name="desktop-outline" size={20} color={theme.colors.white} />
                            <Text style={styles.modalFooterText}>{selectedImage.application}</Text>
                        </View>
                    )}
                </View>
            </Modal>

            {/* Date Pickers */}
            {showStartDatePicker && (
                <DateTimePicker
                    value={startDate}
                    mode="date"
                    display="default"
                    onChange={(event, date) => {
                        setShowStartDatePicker(false);
                        if (date) setStartDate(date);
                    }}
                    maximumDate={endDate}
                />
            )}

            {showEndDatePicker && (
                <DateTimePicker
                    value={endDate}
                    mode="date"
                    display="default"
                    onChange={(event, date) => {
                        setShowEndDatePicker(false);
                        if (date) setEndDate(date);
                    }}
                    minimumDate={startDate}
                    maximumDate={new Date()}
                />
            )}
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
    filtersCard: {
        marginTop: theme.spacing.sm,
        padding: theme.spacing.sm,
    },
    filterRow: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
        marginBottom: theme.spacing.sm,
    },
    filterItem: {
        flex: 1,
    },
    filterLabel: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.xs,
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
    },
    dateText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.textPrimary,
    },
    clearButton: {
        marginTop: theme.spacing.xs,
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
    activityBadge: {
        paddingHorizontal: theme.spacing.xs,
        paddingVertical: 2,
        borderRadius: theme.borderRadius.sm,
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
    timelineFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
        marginTop: theme.spacing.sm,
    },
    applicationText: {
        fontSize: theme.typography.fontSize.sm,
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
    modalFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        padding: theme.spacing.md,
        backgroundColor: 'rgba(0,0,0,0.8)',
    },
    modalFooterText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.white,
    },
});

export default ScreenshotScreen;
