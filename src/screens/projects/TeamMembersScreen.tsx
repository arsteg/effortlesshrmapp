import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert, Modal, TextInput, SafeAreaView, Platform, StatusBar } from 'react-native';
import { useAppSelector } from '../../store/hooks';
import { userService } from '../../services/userService';
import { theme, shadows, typography, spacing, borderRadius } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import { User } from '../../types';

const TeamMembersScreen = () => {
    const { user: currentUser } = useAppSelector((state) => state.auth);

    // State
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [managers, setManagers] = useState<User[]>([]);
    const [selectedManager, setSelectedManager] = useState<User | null>(null);
    const [subordinateIds, setSubordinateIds] = useState<Set<string>>(new Set());

    const [isLoadingUsers, setIsLoadingUsers] = useState(true);
    const [isLoadingTeam, setIsLoadingTeam] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const [showManagerPicker, setShowManagerPicker] = useState(false);
    const [managerSearchQuery, setManagerSearchQuery] = useState('');
    const [memberSearchQuery, setMemberSearchQuery] = useState('');

    // Load initial data
    const loadAllUsers = useCallback(async () => {
        if (!currentUser?.company?.id) {
            Alert.alert("Error", "Company information missing.");
            return;
        }

        setIsLoadingUsers(true);
        try {
            const response = await userService.getUsersByCompany(currentUser.company.id);
            // getUsersByCompany response structure: { users: User[] } based on userService
            // userService.ts: apiService.get<ApiResponse<{ users: User[] }>>(...)

            // Let's handle generic ApiResponse structure carefully
            // The service returns response.data potentially if using generic apiService
            const users = response.data?.users || [];

            if (Array.isArray(users)) {
                setAllUsers(users);
                setManagers(users);

                // Auto-select current user
                if (currentUser && !selectedManager) {
                    const me = users.find(u => u.id === currentUser.id);
                    if (me) setSelectedManager(me);
                    else if (users.length > 0) setSelectedManager(users[0]);
                }
            } else {
                console.warn("Unexpected users data format:", response);
            }
        } catch (error) {
            console.error("Failed to load users:", error);
            Alert.alert("Error", "Could not load user list.");
        } finally {
            setIsLoadingUsers(false);
        }
    }, [currentUser, selectedManager]);

    useEffect(() => {
        loadAllUsers();
    }, [loadAllUsers]);

    // Load subordinates when manager changes
    useEffect(() => {
        if (!selectedManager) return;

        const loadTeam = async () => {
            setIsLoadingTeam(true);
            try {
                const response = await userService.getSubordinates(selectedManager.id);
                const team = response.data || [];
                // API returns User objects of subordinates. We just need IDs for checking state.
                const ids = new Set(team.map(u => u.id));
                setSubordinateIds(ids);
            } catch (error) {
                console.error("Failed to load team:", error);
                // Don't alert here to avoid spamming if switching managers quickly
            } finally {
                setIsLoadingTeam(false);
            }
        };
        loadTeam();
    }, [selectedManager]);

    // Handlers
    const toggleSubordinate = async (user: User) => {
        if (!selectedManager || isUpdating) return;
        if (user.id === selectedManager.id) {
            Alert.alert("Action Not Allowed", "A manager cannot be their own subordinate.");
            return;
        }

        const isSubordinate = subordinateIds.has(user.id);
        setIsUpdating(true);

        // Optimistic UI Update
        const nextIds = new Set(subordinateIds);
        if (isSubordinate) {
            nextIds.delete(user.id);
        } else {
            nextIds.add(user.id);
        }
        setSubordinateIds(nextIds);

        try {
            if (isSubordinate) {
                await userService.deleteSubordinate(selectedManager.id, user.id);
            } else {
                await userService.addSubordinate(selectedManager.id, user.id);
            }
        } catch (error) {
            // Revert on failure
            setSubordinateIds(new Set(subordinateIds)); // Revert to original
            Alert.alert("Update Failed", "Could not update team member. Please try again.");
        } finally {
            setIsUpdating(false);
        }
    };

    // Derived State
    const filteredMembers = useMemo(() => {
        const query = memberSearchQuery.toLowerCase();
        return allUsers.filter(u => {
            const name = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
            const email = (u.email || '').toLowerCase();
            return name.includes(query) || email.includes(query);
        }).sort((a, b) => {
            // Sort: Selected first, then Alphabetical
            const aSelected = subordinateIds.has(a.id);
            const bSelected = subordinateIds.has(b.id);
            if (aSelected === bSelected) {
                return (a.firstName || '').localeCompare(b.firstName || '');
            }
            return aSelected ? -1 : 1;
        });
    }, [allUsers, memberSearchQuery, subordinateIds]);

    const filteredManagers = useMemo(() => {
        const query = managerSearchQuery.toLowerCase();
        return managers.filter(u => {
            const name = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
            return name.includes(query);
        });
    }, [managers, managerSearchQuery]);

    // Renders
    const renderManagerPickerModal = () => (
        <Modal
            visible={showManagerPicker}
            animationType="slide"
            presentationStyle="pageSheet" // "formSheet" on iPad looks better but pageSheet is standard
            onRequestClose={() => setShowManagerPicker(false)}
        >
            <SafeAreaView style={styles.modalSafe}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Select Manager</Text>
                    <TouchableOpacity onPress={() => setShowManagerPicker(false)} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
                    </TouchableOpacity>
                </View>
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color={theme.colors.gray500} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search for a manager..."
                        value={managerSearchQuery}
                        onChangeText={setManagerSearchQuery}
                        autoFocus={false}
                    />
                </View>
                <FlatList
                    data={filteredManagers}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[
                                styles.modalItem,
                                selectedManager?.id === item.id && styles.modalItemSelected
                            ]}
                            onPress={() => {
                                setSelectedManager(item);
                                setShowManagerPicker(false);
                            }}
                        >
                            <View style={styles.avatarSmall}>
                                <Text style={styles.avatarTextSmall}>
                                    {(item.firstName?.[0] || '')}{(item.lastName?.[0] || '')}
                                </Text>
                            </View>
                            <Text style={[
                                styles.modalItemText,
                                selectedManager?.id === item.id && styles.modalItemTextSelected
                            ]}>
                                {item.firstName} {item.lastName}
                            </Text>
                            {selectedManager?.id === item.id && (
                                <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
                            )}
                        </TouchableOpacity>
                    )}
                />
            </SafeAreaView>
        </Modal>
    );

    const renderMemberItem = ({ item }: { item: User }) => {
        const isSelected = subordinateIds.has(item.id);
        const isManager = selectedManager?.id === item.id;

        return (
            <TouchableOpacity
                style={[
                    styles.memberCard,
                    isSelected && styles.memberCardSelected,
                    isManager && styles.memberCardDisabled
                ]}
                onPress={() => !isManager && toggleSubordinate(item)}
                disabled={isManager || isUpdating}
                activeOpacity={0.7}
            >
                <View style={styles.memberInfo}>
                    <View style={[styles.avatar, isSelected && styles.avatarSelected]}>
                        <Text style={[styles.avatarText, isSelected && styles.avatarTextSelected]}>
                            {(item.firstName?.[0] || '')}{(item.lastName?.[0] || '')}
                        </Text>
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={[styles.memberName, isSelected && styles.memberNameSelected]}>
                            {item.firstName} {item.lastName}
                        </Text>
                        <Text style={[styles.memberEmail, isSelected && styles.memberEmailSelected]}>
                            {item.email}
                        </Text>
                        {/* Optional: Show role or job title */}
                        {isManager && <Text style={styles.managerLabel}>Current Manager</Text>}
                    </View>
                </View>
                <View style={styles.actionIcon}>
                    {isSelected ? (
                        <Ionicons name="checkbox" size={28} color={theme.colors.primary} />
                    ) : (
                        <Ionicons name="square-outline" size={28} color={theme.colors.gray400} />
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

            {/* Top Section: Active Manager */}
            <View style={styles.managerHeader}>
                <Text style={styles.sectionLabel}>Managing Team For</Text>
                <TouchableOpacity
                    style={styles.managerSelectorCard}
                    onPress={() => setShowManagerPicker(true)}
                >
                    <View style={styles.selectorRow}>
                        <View style={styles.avatarMedium}>
                            {selectedManager ? (
                                <Text style={styles.avatarTextMedium}>
                                    {(selectedManager.firstName?.[0] || '')}{(selectedManager.lastName?.[0] || '')}
                                </Text>
                            ) : (
                                <Ionicons name="person" size={24} color={theme.colors.white} />
                            )}
                        </View>
                        <View style={styles.selectorInfo}>
                            <Text style={styles.selectorName}>
                                {selectedManager ? `${selectedManager.firstName} ${selectedManager.lastName}` : 'Select Manager'}
                            </Text>
                            <Text style={styles.selectorHint}>Tap to switch manager</Text>
                        </View>
                        <Ionicons name="chevron-down-circle-outline" size={28} color={theme.colors.primary} />
                    </View>
                </TouchableOpacity>
            </View>

            {/* List Header & Search */}
            <View style={styles.listSection}>
                <View style={styles.searchBarContainer}>
                    <Ionicons name="search" size={20} color={theme.colors.gray500} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search employees to add/remove..."
                        value={memberSearchQuery}
                        onChangeText={setMemberSearchQuery}
                    />
                </View>

                {/* Team List */}
                {isLoadingUsers ? (
                    <View style={styles.centerLoading}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                        <Text style={styles.loadingText}>Loading users...</Text>
                    </View>
                ) : (
                    <View style={styles.listContainer}>
                        {/* Optional: Summary Count */}
                        <View style={styles.summaryBar}>
                            <Text style={styles.summaryText}>
                                Team Size: <Text style={{ fontWeight: 'bold', color: theme.colors.primary }}>{subordinateIds.size}</Text>
                            </Text>
                            {isLoadingTeam && <ActivityIndicator size="small" color={theme.colors.primary} />}
                        </View>

                        <FlatList
                            data={filteredMembers}
                            renderItem={renderMemberItem}
                            keyExtractor={item => item.id}
                            contentContainerStyle={styles.flatListContent}
                            initialNumToRender={15}
                            windowSize={5}
                            ListEmptyComponent={
                                <View style={styles.emptyState}>
                                    <Text style={styles.emptyStateText}>No employees found matching "{memberSearchQuery}"</Text>
                                </View>
                            }
                        />
                    </View>
                )}
            </View>

            {renderManagerPickerModal()}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.backgroundSecondary, // Light gray for contrast
    },
    managerHeader: {
        backgroundColor: theme.colors.white,
        paddingHorizontal: spacing.md,
        paddingTop: spacing.md,
        paddingBottom: spacing.lg,
        borderBottomLeftRadius: borderRadius.xl,
        borderBottomRightRadius: borderRadius.xl,
        ...shadows.medium,
        zIndex: 10,
    },
    sectionLabel: {
        fontSize: typography.fontSize.sm,
        color: theme.colors.gray500,
        fontWeight: '600',
        textTransform: 'uppercase',
        marginBottom: spacing.xs,
        marginLeft: spacing.xs,
    },
    managerSelectorCard: {
        backgroundColor: theme.colors.gray50,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.gray200,
    },
    selectorRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarMedium: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    avatarTextMedium: {
        color: theme.colors.white,
        fontSize: typography.fontSize.lg,
        fontWeight: 'bold',
    },
    selectorInfo: {
        flex: 1,
    },
    selectorName: {
        fontSize: typography.fontSize.lg,
        fontWeight: 'bold',
        color: theme.colors.textPrimary,
    },
    selectorHint: {
        fontSize: typography.fontSize.sm,
        color: theme.colors.gray500,
    },

    // List Section
    listSection: {
        flex: 1,
        marginTop: spacing.sm,
    },
    searchBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.white,
        marginHorizontal: spacing.md,
        marginTop: spacing.md,
        paddingHorizontal: spacing.md,
        height: 48,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: theme.colors.gray200,
        ...shadows.small,
    },
    searchInput: {
        flex: 1,
        marginLeft: spacing.sm,
        fontSize: typography.fontSize.md,
        color: theme.colors.textPrimary,
    },
    summaryBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg, // Align with list items text
        paddingVertical: spacing.sm,
    },
    summaryText: {
        fontSize: typography.fontSize.sm,
        color: theme.colors.gray600,
    },
    listContainer: {
        flex: 1,
    },
    flatListContent: {
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.xl,
    },

    // Member Card
    memberCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.colors.white,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: 'transparent', // Reserved for selection state
        ...shadows.small,
    },
    memberCardSelected: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.secondary, // Very light tint 
    },
    memberCardDisabled: {
        opacity: 0.6,
        backgroundColor: theme.colors.gray100,
    },
    memberInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.gray200,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    avatarSelected: {
        backgroundColor: theme.colors.primary,
    },
    avatarText: {
        color: theme.colors.gray600,
        fontWeight: '600',
    },
    avatarTextSelected: {
        color: theme.colors.white,
    },
    textContainer: {
        flex: 1,
    },
    memberName: {
        fontSize: typography.fontSize.md,
        fontWeight: '600',
        color: theme.colors.textPrimary,
    },
    memberNameSelected: {
        color: theme.colors.primaryDark,
    },
    memberEmail: {
        fontSize: typography.fontSize.sm,
        color: theme.colors.gray500,
    },
    memberEmailSelected: {
        color: theme.colors.primary, // Darker tint?
    },
    managerLabel: {
        fontSize: 10,
        color: theme.colors.warning,
        fontWeight: 'bold',
        marginTop: 2,
    },
    actionIcon: {
        marginLeft: spacing.sm,
    },

    // Modal
    modalSafe: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray200,
    },
    modalTitle: {
        fontSize: typography.fontSize.xl,
        fontWeight: 'bold',
        color: theme.colors.textPrimary,
    },
    closeButton: {
        padding: spacing.xs,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.gray100,
        margin: spacing.md,
        paddingHorizontal: spacing.md,
        height: 44,
        borderRadius: borderRadius.md,
    },
    listContent: {
        paddingBottom: spacing.xl,
    },
    modalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray100,
    },
    modalItemSelected: {
        backgroundColor: theme.colors.secondary,
    },
    avatarSmall: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    avatarTextSmall: {
        color: theme.colors.white,
        fontSize: 12,
        fontWeight: 'bold',
    },
    modalItemText: {
        flex: 1,
        fontSize: typography.fontSize.md,
        color: theme.colors.textPrimary,
    },
    modalItemTextSelected: {
        fontWeight: 'bold',
        color: theme.colors.primaryDark,
    },

    // States
    centerLoading: {
        marginTop: spacing.xl,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: spacing.sm,
        color: theme.colors.gray500,
    },
    emptyState: {
        marginTop: spacing.xl,
        alignItems: 'center',
    },
    emptyStateText: {
        color: theme.colors.gray500,
        fontSize: typography.fontSize.md,
    },
});

export default TeamMembersScreen;
