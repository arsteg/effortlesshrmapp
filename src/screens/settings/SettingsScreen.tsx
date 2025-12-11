import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';
import { Card } from '../../components/common/Card';
import { theme } from '../../theme';

export const SettingsScreen = ({ navigation }: any) => {
    const dispatch = useAppDispatch();
    const { user } = useAppSelector((state) => state.auth);

    const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
    const [emailNotifications, setEmailNotifications] = React.useState(true);
    const [pushNotifications, setPushNotifications] = React.useState(true);

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: () => dispatch(logout()),
                },
            ]
        );
    };

    const settingsSections = [
        {
            title: 'Account',
            items: [
                {
                    icon: 'person-outline',
                    label: 'Profile',
                    onPress: () => navigation.navigate('Profile'),
                    showArrow: true,
                },
                {
                    icon: 'lock-closed-outline',
                    label: 'Change Password',
                    onPress: () => navigation.navigate('ChangePassword'),
                    showArrow: true,
                },
            ],
        },
        {
            title: 'Notifications',
            items: [
                {
                    icon: 'notifications-outline',
                    label: 'Push Notifications',
                    value: pushNotifications,
                    onToggle: setPushNotifications,
                    isSwitch: true,
                },
                {
                    icon: 'mail-outline',
                    label: 'Email Notifications',
                    value: emailNotifications,
                    onToggle: setEmailNotifications,
                    isSwitch: true,
                },
            ],
        },
        {
            title: 'Support',
            items: [
                {
                    icon: 'help-circle-outline',
                    label: 'Help & FAQ',
                    onPress: () => navigation.navigate('Help'),
                    showArrow: true,
                },
                {
                    icon: 'document-text-outline',
                    label: 'Terms of Service',
                    onPress: () => { },
                    showArrow: true,
                },
                {
                    icon: 'shield-checkmark-outline',
                    label: 'Privacy Policy',
                    onPress: () => { },
                    showArrow: true,
                },
            ],
        },
        {
            title: 'About',
            items: [
                {
                    icon: 'information-circle-outline',
                    label: 'App Version',
                    value: '1.0.0',
                    showArrow: false,
                },
            ],
        },
    ];

    return (
        <View style={styles.container}>
            <StatusBar style="light" backgroundColor={theme.colors.primary} />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {settingsSections.map((section, sectionIndex) => (
                    <View key={sectionIndex}>
                        <Text style={styles.sectionTitle}>{section.title}</Text>
                        <Card style={styles.card}>
                            {section.items.map((item, itemIndex) => (
                                <TouchableOpacity
                                    key={itemIndex}
                                    style={[
                                        styles.settingItem,
                                        itemIndex < section.items.length - 1 && styles.settingItemBorder,
                                    ]}
                                    onPress={item.onPress}
                                    disabled={item.isSwitch}
                                >
                                    <View style={styles.settingItemLeft}>
                                        <Ionicons
                                            name={item.icon as any}
                                            size={24}
                                            color={theme.colors.gray600}
                                        />
                                        <Text style={styles.settingItemLabel}>{item.label}</Text>
                                    </View>
                                    <View style={styles.settingItemRight}>
                                        {item.isSwitch ? (
                                            <Switch
                                                value={item.value}
                                                onValueChange={item.onToggle}
                                                trackColor={{
                                                    false: theme.colors.gray300,
                                                    true: theme.colors.primary,
                                                }}
                                            />
                                        ) : item.value ? (
                                            <Text style={styles.settingItemValue}>{item.value}</Text>
                                        ) : item.showArrow ? (
                                            <Ionicons
                                                name="chevron-forward"
                                                size={20}
                                                color={theme.colors.gray400}
                                            />
                                        ) : null}
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </Card>
                    </View>
                ))}

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={24} color={theme.colors.error} />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.backgroundSecondary,
    },
    scrollContent: {
        padding: theme.spacing.md,
    },
    sectionTitle: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.md,
        marginBottom: theme.spacing.sm,
        marginLeft: theme.spacing.xs,
        textTransform: 'uppercase',
    },
    card: {
        marginBottom: theme.spacing.sm,
        padding: 0,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing.md,
    },
    settingItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray200,
    },
    settingItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        flex: 1,
    },
    settingItemLabel: {
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.textPrimary,
    },
    settingItemRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingItemValue: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.textSecondary,
        marginRight: theme.spacing.xs,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.sm,
        padding: theme.spacing.md,
        marginTop: theme.spacing.xl,
        marginBottom: theme.spacing.xl,
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.error,
    },
    logoutText: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.error,
    },
});
