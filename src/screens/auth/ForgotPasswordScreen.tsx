import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Animated,
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

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

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
                'Check Your Email',
                'We have sent password reset instructions to your email address.',
                [{ text: 'Return to Login', onPress: () => navigation.navigate('Login') }]
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
            <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <Animated.View
                    style={[
                        styles.content,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        },
                    ]}
                >
                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="lock-open-outline" size={40} color={theme.colors.primary} />
                        </View>
                        <Text style={styles.headerText}>Forgot Password?</Text>
                        <Text style={styles.headerSubtext}>
                            Don't worry! It happens. Please enter the email associated with your account.
                        </Text>
                    </View>

                    <View style={styles.formContainer}>
                        <Input
                            label="Email Address"
                            placeholder="name@company.com"
                            value={email}
                            onChangeText={(text) => {
                                setEmail(text);
                                if (error) setError('');
                            }}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            error={error}
                            icon={<Ionicons name="mail-outline" size={20} color={theme.colors.gray500} />}
                        />

                        <Button
                            title="Send Instructions"
                            onPress={handleSubmit}
                            loading={loading}
                            style={styles.submitButton}
                        />

                        <Button
                            title="Back to Sign In"
                            onPress={() => navigation.navigate('Login')}
                            variant="ghost"
                        />
                    </View>
                </Animated.View>
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
        justifyContent: 'center',
        padding: theme.spacing.lg,
    },
    content: {
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
    },
    iconContainer: {
        width: 70,
        height: 70,
        borderRadius: 20,
        backgroundColor: theme.colors.secondary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: theme.spacing.lg,
    },
    headerText: {
        fontSize: theme.typography.fontSize.header,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing.sm,
    },
    headerSubtext: {
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: theme.typography.lineHeight.normal * theme.typography.fontSize.md,
        paddingHorizontal: theme.spacing.md,
    },
    formContainer: {
        marginTop: theme.spacing.sm,
    },
    submitButton: {
        marginBottom: theme.spacing.md,
        marginTop: theme.spacing.sm,
    },
});
