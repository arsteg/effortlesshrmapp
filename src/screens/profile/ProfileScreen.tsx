import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Image,
    Alert,
    Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { updateUser } from '../../store/slices/authSlice';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Loading } from '../../components/common/Loading';
import { theme } from '../../theme';
import { profileService } from '../../services/profileService';

export const ProfileScreen = ({ navigation }: any) => {
    const dispatch = useAppDispatch();
    const { user } = useAppSelector((state) => state.auth);

    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [profileImage, setProfileImage] = useState<string | null>(null);

    // Form fields
    const [firstName, setFirstName] = useState(user?.firstName || '');
    const [lastName, setLastName] = useState(user?.lastName || '');
    const [email, setEmail] = useState(user?.email || '');
    const [phone, setPhone] = useState(user?.phone || '');

    useEffect(() => {
        if (user) {
            setFirstName(user.firstName || '');
            setLastName(user.lastName || '');
            setEmail(user.email || '');
            setPhone(user.phone || '');
            setProfileImage(user.profilePicture || null);
        }
    }, [user]);

    const handlePickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to upload a profile picture.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setProfileImage(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        if (!user?.id) return;

        setLoading(true);
        try {
            // Upload profile picture if changed
            let profilePictureUrl = profileImage;
            if (profileImage && profileImage !== user.profilePicture) {
                try {
                    const uploadResult = await profileService.uploadProfilePicture(user.id, profileImage);
                    profilePictureUrl = uploadResult.url;
                } catch (uploadError) {
                    console.warn('Profile picture upload failed, continuing with other updates', uploadError);
                }
            }

            // Update profile data
            const updatedData = {
                firstName,
                lastName,
                email,
                phone,
                profilePicture: profilePictureUrl || undefined,
            };

            await profileService.updateProfile(user.id, updatedData);

            // Update Redux state
            dispatch(updateUser(updatedData));

            setIsEditing(false);
            Alert.alert('Success', 'Profile updated successfully!');
        } catch (error: any) {
            console.error('Profile update error:', error);
            Alert.alert('Error', error.message || 'Failed to update profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setFirstName(user?.firstName || '');
        setLastName(user?.lastName || '');
        setEmail(user?.email || '');
        setPhone(user?.phone || '');
        setProfileImage(user?.profilePicture || null);
        setIsEditing(false);
    };

    const handleChangePassword = () => {
        navigation.navigate('ChangePassword');
    };

    const getInitials = () => {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    };

    if (loading) {
        return <Loading message="Updating profile..." />;
    }

    return (
        <View style={styles.container}>
            <StatusBar style="light" backgroundColor={theme.colors.primary} />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Profile Picture Section */}
                <Card style={styles.profileCard}>
                    <View style={styles.profileImageContainer}>
                        {profileImage ? (
                            <Image source={{ uri: profileImage }} style={styles.profileImage} />
                        ) : (
                            <View style={styles.profileImagePlaceholder}>
                                <Text style={styles.initialsText}>{getInitials()}</Text>
                            </View>
                        )}
                        {isEditing && (
                            <TouchableOpacity style={styles.editImageButton} onPress={handlePickImage}>
                                <Ionicons name="camera" size={20} color={theme.colors.white} />
                            </TouchableOpacity>
                        )}
                    </View>
                    <Text style={styles.userName}>{firstName} {lastName}</Text>
                    <Text style={styles.userEmail}>{email}</Text>
                    <Text style={styles.userRole}>{user?.isAdmin ? 'Administrator' : 'User'}</Text>
                </Card>

                {/* Personal Information */}
                <Card style={styles.infoCard}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>Personal Information</Text>
                        {!isEditing && (
                            <TouchableOpacity onPress={() => setIsEditing(true)}>
                                <Ionicons name="pencil" size={20} color={theme.colors.primary} />
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>First Name</Text>
                        <TextInput
                            style={[styles.input, !isEditing && styles.inputDisabled]}
                            value={firstName}
                            onChangeText={setFirstName}
                            editable={isEditing}
                            placeholder="Enter first name"
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Last Name</Text>
                        <TextInput
                            style={[styles.input, !isEditing && styles.inputDisabled]}
                            value={lastName}
                            onChangeText={setLastName}
                            editable={isEditing}
                            placeholder="Enter last name"
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={[styles.input, !isEditing && styles.inputDisabled]}
                            value={email}
                            onChangeText={setEmail}
                            editable={isEditing}
                            placeholder="Enter email"
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Phone</Text>
                        <TextInput
                            style={[styles.input, !isEditing && styles.inputDisabled]}
                            value={phone}
                            onChangeText={setPhone}
                            editable={isEditing}
                            placeholder="Enter phone number"
                            keyboardType="phone-pad"
                        />
                    </View>

                    {isEditing && (
                        <View style={styles.buttonRow}>
                            <Button
                                title="Cancel"
                                onPress={handleCancel}
                                variant="outline"
                                style={styles.button}
                            />
                            <Button
                                title="Save"
                                onPress={handleSave}
                                style={styles.button}
                            />
                        </View>
                    )}
                </Card>

                {/* Security Section */}
                <Card style={styles.securityCard}>
                    <Text style={styles.cardTitle}>Security</Text>
                    <TouchableOpacity style={styles.securityItem} onPress={handleChangePassword}>
                        <View style={styles.securityItemLeft}>
                            <Ionicons name="lock-closed-outline" size={24} color={theme.colors.gray600} />
                            <Text style={styles.securityItemText}>Change Password</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme.colors.gray400} />
                    </TouchableOpacity>
                </Card>

                {/* Account Information */}
                <Card style={styles.accountCard}>
                    <Text style={styles.cardTitle}>Account Information</Text>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>User ID:</Text>
                        <Text style={styles.infoValue}>{user?.id}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Member Since:</Text>
                        <Text style={styles.infoValue}>
                            {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Account Type:</Text>
                        <Text style={styles.infoValue}>{user?.isAdmin ? 'Admin' : 'Standard User'}</Text>
                    </View>
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
    profileCard: {
        alignItems: 'center',
        paddingVertical: theme.spacing.xl,
        marginBottom: theme.spacing.md,
    },
    profileImageContainer: {
        position: 'relative',
        marginBottom: theme.spacing.md,
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 3,
        borderColor: theme.colors.primary,
    },
    profileImagePlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: theme.colors.primaryDark,
    },
    initialsText: {
        fontSize: 40,
        fontWeight: 'bold',
        color: theme.colors.white,
    },
    editImageButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: theme.colors.primary,
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: theme.colors.white,
    },
    userName: {
        fontSize: theme.typography.fontSize.xxl,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing.xs,
    },
    userEmail: {
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.xs,
    },
    userRole: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.primary,
        fontWeight: theme.typography.fontWeight.medium,
        backgroundColor: theme.colors.secondary,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.borderRadius.md,
    },
    infoCard: {
        marginBottom: theme.spacing.md,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    cardTitle: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing.md,
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
    input: {
        borderWidth: 1,
        borderColor: theme.colors.gray300,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.sm,
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.textPrimary,
        backgroundColor: theme.colors.white,
    },
    inputDisabled: {
        backgroundColor: theme.colors.gray100,
        color: theme.colors.gray600,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
        marginTop: theme.spacing.md,
    },
    button: {
        flex: 1,
    },
    securityCard: {
        marginBottom: theme.spacing.md,
    },
    securityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray200,
    },
    securityItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
    },
    securityItemText: {
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.textPrimary,
    },
    accountCard: {
        marginBottom: theme.spacing.md,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: theme.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray200,
    },
    infoLabel: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.textSecondary,
    },
    infoValue: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.textPrimary,
        fontWeight: theme.typography.fontWeight.medium,
    },
});
