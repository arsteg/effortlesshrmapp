import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { togglePortalMode, logout } from '../store/slices/authSlice';
import { theme } from '../theme';

export const CustomDrawerContent = (props: any) => {
    const dispatch = useAppDispatch();
    const { user, isAdminPortal } = useAppSelector((state) => state.auth);

    const handleLogout = () => {
        dispatch(logout());
    };

    const handleSwitchPortal = () => {
        dispatch(togglePortalMode());
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
                    <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
                    <Text style={styles.userEmail}>{user?.email}</Text>
                    <Text style={styles.portalBadge}>
                        {isAdminPortal ? 'Admin Portal' : 'User Portal'}
                    </Text>
                </View>

                {/* Drawer Items */}
                <View style={styles.drawerItemsContainer}>
                    <DrawerItemList {...props} />
                </View>
            </DrawerContentScrollView>

            {/* Bottom Actions Area */}
            <View style={styles.bottomSection}>
                {isUserAdmin && (
                    <TouchableOpacity onPress={handleSwitchPortal} style={styles.actionButton}>
                        <View style={styles.actionContent}>
                            <Ionicons
                                name="swap-horizontal-outline"
                                size={22}
                                color={theme.colors.gray800}
                            />
                            <Text style={styles.actionText}>
                                Switch to {isAdminPortal ? 'User' : 'Admin'} View
                            </Text>
                        </View>
                    </TouchableOpacity>
                )}

                <TouchableOpacity onPress={handleLogout} style={styles.actionButton}>
                    <View style={styles.actionContent}>
                        <Ionicons
                            name="log-out-outline"
                            size={22}
                            color={theme.colors.error}
                        />
                        <Text style={[styles.actionText, { color: theme.colors.error }]}>
                            Sign Out
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    userHeader: {
        padding: 20,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        marginBottom: 10,
    },
    avatarContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: theme.colors.white,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    avatarText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: theme.colors.primary,
    },
    userName: {
        color: theme.colors.white,
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    userEmail: {
        color: theme.colors.white,
        fontSize: 14,
        opacity: 0.8,
        marginBottom: 8,
    },
    portalBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        overflow: 'hidden',
        color: theme.colors.white,
        fontSize: 12,
        fontWeight: '600',
    },
    drawerItemsContainer: {
        flex: 1,
        backgroundColor: theme.colors.white,
        paddingTop: 10,
    },
    bottomSection: {
        padding: 20,
        backgroundColor: theme.colors.white,
        borderTopWidth: 1,
        borderTopColor: theme.colors.gray200,
    },
    actionButton: {
        paddingVertical: 12,
    },
    actionContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionText: {
        fontSize: 15,
        marginLeft: 15,
        fontWeight: '500',
        color: theme.colors.gray800,
    },
});
