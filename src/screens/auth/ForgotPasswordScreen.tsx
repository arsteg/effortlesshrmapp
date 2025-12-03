import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { theme } from '../../theme';
import { isValidEmail } from '../../utils/constants';
import { authService } from '../../services/authService';

export const ForgotPasswordScreen = ({ navigation }: any) => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setError('');

        if (!email) {
            setError('Please enter your email');
            return;
        }

        if (!isValidEmail(email)) {
            setError('Please enter a valid email');
            return;
        }

        setLoading(true);
        try {
            await authService.forgotPassword({ email });
            Alert.alert(
                'Success',
                'Password reset instructions have been sent to your email',
                [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
            );
        } catch (err: any) {
            setError(err.message || 'Failed to send reset email');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
           <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.header}>
                    <Text style={styles.headerText}>Forgot Password</Text>
                    <Text style={styles.headerSubtext}>
                        Enter your email to receive password reset instructions
                    </Text>
                </View>

                <View style={styles.formContainer}>
                    <Input
                        label="Email Address"
                        placeholder="Enter your email"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        error={error}
                        icon={<Ionicons name="mail-outline" size={20} color={theme.colors.gray500} />}
                    />

                    <Button
                        title="Send Reset Link"
                        onPress={handleSubmit}
                        loading={loading}
                    />

                    <Button
                        title="Back to Login"
                        onPress={() => navigation.navigate('Login')}
                        variant="outline"
                        style={styles.backButton}
                    />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scrollContent: {
        flexGrow: 1,
    },
    header: {
        backgroundColor: theme.colors.primary,
        paddingVertical: theme.spacing.xxl,
        paddingHorizontal: theme.spacing.lg,
        minHeight: 150,
    },
    headerText: {
        fontSize: theme.typography.fontSize.hero,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.white,
        marginBottom: theme.spacing.sm,
    },
    headerSubtext: {
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.white,
        opacity: 0.9,
    },
    formContainer: {
        flex: 1,
        backgroundColor: theme.colors.white,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        marginTop: -30,
        paddingTop: theme.spacing.xl,
        paddingHorizontal: theme.spacing.lg,
    },
    backButton: {
        marginTop: theme.spacing.md,
    },
});
