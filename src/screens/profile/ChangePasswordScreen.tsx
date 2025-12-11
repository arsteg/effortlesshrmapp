import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAppSelector } from '../../store/hooks';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Loading } from '../../components/common/Loading';
import { theme } from '../../theme';
import { profileService } from '../../services/profileService';

export const ChangePasswordScreen = ({ navigation }: any) => {
    const { user } = useAppSelector((state) => state.auth);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const validatePassword = () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return false;
        }

        if (newPassword.length < 6) {
            Alert.alert('Error', 'New password must be at least 6 characters long');
            return false;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'New passwords do not match');
            return false;
        }

        if (currentPassword === newPassword) {
            Alert.alert('Error', 'New password must be different from current password');
            return false;
        }

        return true;
    };

    const handleChangePassword = async () => {
        if (!validatePassword() || !user?.id) return;

        setLoading(true);
        try {
            await profileService.changePassword(user.id, currentPassword, newPassword);

            Alert.alert(
                'Success',
                'Password changed successfully!',
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.goBack(),
                    },
                ]
            );
        } catch (error: any) {
            console.error('Change password error:', error);
            Alert.alert('Error', error.message || 'Failed to change password. Please check your current password and try again.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <Loading message="Changing password..." />;
    }

    return (
        <View style={styles.container}>
            <StatusBar style="light" backgroundColor={theme.colors.primary} />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Card style={styles.card}>
                    <Text style={styles.title}>Change Password</Text>
                    <Text style={styles.subtitle}>
                        Please enter your current password and choose a new password
                    </Text>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Current Password</Text>
                        <View style={styles.passwordContainer}>
                            <TextInput
                                style={styles.passwordInput}
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                                secureTextEntry={!showCurrentPassword}
                                placeholder="Enter current password"
                                autoCapitalize="none"
                            />
                        </View>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>New Password</Text>
                        <View style={styles.passwordContainer}>
                            <TextInput
                                style={styles.passwordInput}
                                value={newPassword}
                                onChangeText={setNewPassword}
                                secureTextEntry={!showNewPassword}
                                placeholder="Enter new password"
                                autoCapitalize="none"
                            />
                        </View>
                        <Text style={styles.hint}>Must be at least 6 characters</Text>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Confirm New Password</Text>
                        <View style={styles.passwordContainer}>
                            <TextInput
                                style={styles.passwordInput}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showConfirmPassword}
                                placeholder="Confirm new password"
                                autoCapitalize="none"
                            />
                        </View>
                    </View>

                    <View style={styles.buttonContainer}>
                        <Button
                            title="Cancel"
                            onPress={() => navigation.goBack()}
                            variant="outline"
                            style={styles.button}
                        />
                        <Button
                            title="Change Password"
                            onPress={handleChangePassword}
                            style={styles.button}
                        />
                    </View>
                </Card>

                {/* Password Requirements */}
                <Card style={styles.requirementsCard}>
                    <Text style={styles.requirementsTitle}>Password Requirements:</Text>
                    <Text style={styles.requirementItem}>• At least 6 characters long</Text>
                    <Text style={styles.requirementItem}>• Different from current password</Text>
                    <Text style={styles.requirementItem}>• Recommended: Mix of letters, numbers, and symbols</Text>
                </Card>
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
    card: {
        marginBottom: theme.spacing.md,
    },
    title: {
        fontSize: theme.typography.fontSize.xxl,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing.xs,
    },
    subtitle: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.lg,
    },
    formGroup: {
        marginBottom: theme.spacing.md,
    },
    label: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.xs,
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.gray300,
        borderRadius: theme.borderRadius.md,
        backgroundColor: theme.colors.white,
    },
    passwordInput: {
        flex: 1,
        padding: theme.spacing.sm,
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.textPrimary,
    },
    hint: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.xs,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
        marginTop: theme.spacing.lg,
    },
    button: {
        flex: 1,
    },
    requirementsCard: {
        backgroundColor: theme.colors.secondary,
    },
    requirementsTitle: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing.sm,
    },
    requirementItem: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.xs,
    },
});
