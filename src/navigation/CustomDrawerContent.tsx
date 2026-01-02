import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { togglePortalMode, logout, switchPortalMode } from '../store/slices/authSlice';
import { theme } from '../theme';
import { Button } from '../components/common/Button';

export const CustomDrawerContent = (props: any) => {
    const dispatch = useAppDispatch();
    const { user, isAdminPortal } = useAppSelector((state) => state.auth);

    const handleLogout = () => {
        dispatch(logout());
    };

    const handleSwitchPortal = () => {
        dispatch(switchPortalMode());
        props.navigation.closeDrawer();
    };

    // Helper to get initials
    const getInitials = (firstName: string = '', lastName: string = '') => {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    };

    const isUserAdmin = React.useMemo(() => {
        if (!user) return false;
        if (user.isAdmin) return true;
        if (!user.role) return false;

        const roleName = typeof user.role === 'string' ? user.role : user.role.name;
        return roleName?.toLowerCase() === 'admin';
    }, [user]);

    return (
        <View style={{ flex: 1 }}>
            <DrawerContentScrollView {...props} contentContainerStyle={{ backgroundColor: theme.colors.primary }}>
                {/* User Header Section */}
                <View style={styles.userHeader}>
                    <View style={styles.avatarContainer}>
                        <Text style={styles.avatarText}>
                            {getInitials(user?.firstName, user?.lastName)}
                        </Text>
                    </View>
                    <View style={styles.userInfo}>
                        <Text style={styles.userName} numberOfLines={1}>{user?.firstName} {user?.lastName}</Text>
                        <Text style={styles.userEmail} numberOfLines={1}>{user?.email}</Text>
                        <View style={styles.badgeContainer}>
                            <Text style={styles.portalBadge}>
                                {isAdminPortal ? 'Admin Portal' : 'User Portal'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Drawer Items */}
                <View style={styles.drawerItemsContainer}>
                    <DrawerItemList {...props} />
                </View>
            </DrawerContentScrollView>

            {/* Bottom Actions Area */}
            <View style={styles.bottomSection}>
                {isUserAdmin && (
                    <Button
                        title={`Switch to ${isAdminPortal ? 'User' : 'Admin'}`}
                        onPress={handleSwitchPortal}
                        variant="ghost"
                        icon={<Ionicons name="swap-horizontal-outline" size={20} color={theme.colors.gray800} />}
                        style={styles.actionButton}
                        textStyle={{ color: theme.colors.gray800 }}
                    />
                )}

                <Button
                    title="Sign Out"
                    onPress={handleLogout}
                    variant="ghost"
                    icon={<Ionicons name="log-out-outline" size={20} color={theme.colors.error} />}
                    style={styles.actionButton}
                    textStyle={{ color: theme.colors.error }}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    userHeader: {
        padding: theme.spacing.sm,         // Reduced to small padding
        paddingTop: 30,                    // Minimized top padding (enough for status bar area)
        paddingBottom: theme.spacing.sm,
        backgroundColor: theme.colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 0,
    },
    avatarContainer: {
        width: 46,                         // Slightly smaller avatar
        height: 46,
        borderRadius: 23,
        backgroundColor: theme.colors.white,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,                    // Reduced margin between avatar and text
    },
    avatarText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.primary,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        color: theme.colors.white,
        fontSize: theme.typography.fontSize.md, // Reduced from lg
        fontWeight: 'bold',
        marginBottom: 2,
    },
    userEmail: {
        color: theme.colors.white,
        fontSize: 11,                      // Reduced from xs (12)
        opacity: 0.9,
        marginBottom: 4,                   // Reduced from 8
    },
    badgeContainer: {
        alignSelf: 'flex-start',
    },
    portalBadge: {
        backgroundColor: 'rgba(255,255,255,0.25)',
        paddingHorizontal: 8,              // Reduced from 10
        paddingVertical: 2,
        borderRadius: theme.borderRadius.round,
        color: theme.colors.white,
        fontSize: 10,
        fontWeight: 'bold',
        overflow: 'hidden',
    },
    drawerItemsContainer: {
        flex: 1,
        backgroundColor: theme.colors.white,
        paddingTop: 0,                     // Removed top padding (was 10)
    },
    bottomSection: {
        padding: theme.spacing.sm,         // Reduced form 20 (~theme.spacing.lg) to sm (10)
        backgroundColor: theme.colors.white,
        borderTopWidth: 1,
        borderTopColor: theme.colors.gray200,
    },
    actionButton: {
        justifyContent: 'flex-start',
        paddingHorizontal: 0,
        height: 40,                        // Explicit smaller height
        minHeight: 0,                      // Override any minHeight defaults
    },
});
