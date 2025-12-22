import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    RefreshControl,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme';
import { Card } from '../../components/common/Card';
import { timeLogService, RealTimeData } from '../../services/timeLogService';
import { useAppSelector } from '../../store/hooks';

const RealTimeScreen = () => {
    const navigation = useNavigation<any>();
    const { isAdminPortal } = useAppSelector((state) => state.auth);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState<RealTimeData | null>(null);
    const [searchText, setSearchText] = useState('');
    const [filteredUsers, setFilteredUsers] = useState<RealTimeData['onlineUsers']>([]);

    const fetchData = useCallback(async () => {
        try {
            const result = await timeLogService.getRealTimeUsers();
            console.log('RealTime data fetched:', JSON.stringify(result, null, 2));

            if (result && Array.isArray(result) && result.length > 0) {
                const realTimeObj = result[0];
                setData(realTimeObj);
                if (realTimeObj.onlineUsers) {
                    filterUsers(realTimeObj.onlineUsers, searchText);
                } else {
                    setFilteredUsers([]);
                }
            } else if (result && !Array.isArray(result)) {
                // Fallback for unexpected object structure
                const anyResult = result as any;
                const finalData = anyResult.data?.[0] || anyResult.data || anyResult[0] || anyResult;
                if (finalData) {
                    setData(finalData);
                    filterUsers(finalData.onlineUsers || [], searchText);
                }
            }
        } catch (error) {
            console.error('Failed to fetch real-time data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [searchText]);

    useEffect(() => {
        fetchData();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const filterUsers = (users: RealTimeData['onlineUsers'], text: string) => {
        if (!text) {
            setFilteredUsers(users);
            return;
        }
        const filtered = users.filter(item =>
            `${item.user.firstName} ${item.user.lastName}`.toLowerCase().includes(text.toLowerCase()) ||
            item.project.toLowerCase().includes(text.toLowerCase()) ||
            item.task.toLowerCase().includes(text.toLowerCase())
        );
        setFilteredUsers(filtered);
    };

    const handleSearch = (text: string) => {
        setSearchText(text);
        if (data) {
            filterUsers(data.onlineUsers, text);
        }
    };

    const handleLiveView = (userIds: string[]) => {
        navigation.navigate('LiveScreen', { userIds });
    };

    const renderUserItem = ({ item }: { item: RealTimeData['onlineUsers'][0] }) => {
        const initials = `${item.user.firstName?.[0] || ''}${item.user.lastName?.[0] || ''}`.toUpperCase();
        const statusColor = item.isOnline ? theme.colors.success : theme.colors.gray400;
        const statusText = item.isOnline ? 'Online' : 'Offline';

        return (
            <Card style={styles.userCard}>
                <View style={styles.userRow}>
                    <View style={styles.avatarContainer}>
                        <View style={[styles.avatar, { backgroundColor: theme.colors.secondary }]}>
                            <Text style={styles.avatarText}>{initials}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: statusColor }]} />
                    </View>

                    <View style={styles.userInfo}>
                        <Text style={styles.userName} numberOfLines={1}>
                            {item.user.firstName} {item.user.lastName}
                        </Text>

                        <View style={styles.detailsContainer}>
                            <View style={styles.userDetailRow}>
                                <Ionicons name="briefcase-outline" size={12} color={theme.colors.gray500} />
                                <Text style={styles.userDetailText} numberOfLines={1}>{item.project}</Text>
                            </View>
                            <View style={styles.userDetailRow}>
                                <Ionicons name="list-outline" size={12} color={theme.colors.gray500} />
                                <Text style={styles.userDetailText} numberOfLines={1}>{item.task}</Text>
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.liveButton, !item.isOnline && styles.disabledButton]}
                        onPress={() => item.isOnline && handleLiveView([item.user.id])}
                        disabled={!item.isOnline}
                    >
                        <Ionicons
                            name={item.isOnline ? "videocam" : "videocam-outline"}
                            size={18}
                            color={item.isOnline ? theme.colors.white : theme.colors.gray400}
                        />
                        <Text style={[styles.liveButtonText, !item.isOnline && styles.disabledButtonText]}>Live</Text>
                    </TouchableOpacity>
                </View>
            </Card>
        );
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    const onlineUserIds = filteredUsers.map(u => u.user.id);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>RealTime Monitoring</Text>
                <View style={styles.headerActions}>
                    {onlineUserIds.length > 0 && (
                        <TouchableOpacity
                            onPress={() => handleLiveView(onlineUserIds)}
                            style={styles.allLiveButton}
                        >
                            <Ionicons name="videocam" size={20} color={theme.colors.white} />
                            <Text style={styles.allLiveText}>All Live</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={onRefresh} style={styles.refreshIcon}>
                        <Ionicons name="refresh" size={24} color={theme.colors.primary} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.statsRow}>
                <Card style={styles.statCard}>
                    <Text style={styles.statLabel}>Members</Text>
                    <Text style={styles.statValue}>{data?.totalMember || 0}</Text>
                    <Ionicons name="people" size={20} color={theme.colors.gray400} style={styles.statIcon} />
                </Card>
                <Card style={styles.statCard}>
                    <Text style={styles.statLabel}>Working</Text>
                    <Text style={[styles.statValue, { color: theme.colors.success }]}>{data?.activeMember || 0}</Text>
                    <Ionicons name="radio-button-on" size={20} color={theme.colors.success} style={styles.statIcon} />
                </Card>
                <Card style={styles.statCard}>
                    <Text style={styles.statLabel}>Others</Text>
                    <Text style={[styles.statValue, { color: theme.colors.error }]}>{data?.totalNonProductiveMember || 0}</Text>
                    <Ionicons name="radio-button-off" size={20} color={theme.colors.error} style={styles.statIcon} />
                </Card>
            </View>

            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={theme.colors.gray400} style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search user, project or task..."
                    value={searchText}
                    onChangeText={handleSearch}
                />
            </View>

            <FlatList
                data={filteredUsers}
                renderItem={renderUserItem}
                keyExtractor={(item, index) => `${item.user.id}-${index}`}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
                }
                ListEmptyComponent={
                    <View style={styles.centered}>
                        <Text style={styles.emptyText}>No users found</Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.backgroundSecondary,
        padding: theme.spacing.md,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
    },
    allLiveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.primary,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        gap: 6,
    },
    allLiveText: {
        color: theme.colors.white,
        fontSize: theme.typography.fontSize.xs,
        fontWeight: 'bold',
    },
    title: {
        fontSize: theme.typography.fontSize.xl,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.textPrimary,
    },
    refreshIcon: {
        padding: 5,
    },
    statsRow: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
        marginBottom: theme.spacing.lg,
    },
    statCard: {
        flex: 1,
        padding: theme.spacing.sm,
        position: 'relative',
    },
    statLabel: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.textSecondary,
        marginBottom: 4,
    },
    statValue: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.textPrimary,
    },
    statIcon: {
        position: 'absolute',
        top: 8,
        right: 8,
        opacity: 0.6,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.md,
        paddingHorizontal: theme.spacing.sm,
        marginBottom: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.gray200,
    },
    searchIcon: {
        marginRight: theme.spacing.xs,
    },
    searchInput: {
        flex: 1,
        height: 45,
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.textPrimary,
    },
    listContent: {
        paddingBottom: theme.spacing.xl,
    },
    userCard: {
        marginBottom: theme.spacing.sm,
        padding: theme.spacing.sm,
        borderRadius: theme.borderRadius.lg,
    },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        position: 'relative',
        marginRight: theme.spacing.md,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.gray100,
    },
    avatarText: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: 'bold',
        color: theme.colors.primary,
    },
    statusBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 2,
        borderColor: theme.colors.white,
    },
    userInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    userName: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: '700',
        color: theme.colors.textPrimary,
        marginBottom: 4,
    },
    detailsContainer: {
        flexDirection: 'column',
    },
    userDetailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    userDetailText: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.textSecondary,
        marginLeft: 4,
    },
    liveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        backgroundColor: theme.colors.primary,
        gap: 6,
        marginLeft: theme.spacing.sm,
    },
    liveButtonText: {
        color: theme.colors.white,
        fontSize: theme.typography.fontSize.xs,
        fontWeight: 'bold',
    },
    disabledButton: {
        backgroundColor: theme.colors.gray100,
        borderColor: 'transparent',
    },
    disabledButtonText: {
        color: theme.colors.gray400,
    },
    emptyText: {
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.textSecondary,
        marginTop: 20,
    },
});

export default RealTimeScreen;
