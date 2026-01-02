import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Animated,
    Dimensions,
} from 'react-native';
import { StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { login } from '../../store/slices/authSlice';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { theme } from '../../theme';
import { isValidEmail } from '../../utils/constants';
import { storage, secureStorage } from '../../utils/storage';

const { width, height } = Dimensions.get('window');

export const LoginScreen = ({ navigation }: any) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

    // Animation values
    const fadeAnim = React.useRef(new Animated.Value(0)).current;
    const slideAnim = React.useRef(new Animated.Value(30)).current;

    const dispatch = useAppDispatch();
    const { isLoading, error } = useAppSelector((state) => state.auth);

    useEffect(() => {
        loadRememberMeData();
        startEnterAnimation();
    }, []);

    useEffect(() => {
        if (error) {
            Alert.alert('Login Failed', error);
        }
    }, [error]);

    const startEnterAnimation = () => {
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
    };

    const loadRememberMeData = async () => {
        try {
            const isRemember = await storage.getItem('IsRemember');
            if (isRemember === 'true') {
                const savedEmail = await storage.getItem('Email');
                const savedPassword = await secureStorage.getItem('Password');
                if (savedEmail) setEmail(savedEmail);
                if (savedPassword) setPassword(savedPassword);
                setRememberMe(true);
            }
        } catch (error) {
            console.error('Error loading remember me data:', error);
        }
    };

    const saveRememberMeData = async () => {
        try {
            if (rememberMe) {
                await storage.setItem('Email', email);
                await secureStorage.setItem('Password', password);
                await storage.setItem('IsRemember', 'true');
            } else {
                await storage.removeItem('Email');
                await secureStorage.removeItem('Password');
                await storage.removeItem('IsRemember');
            }
        } catch (error) {
            console.error('Error saving remember me data:', error);
        }
    };

    const validate = (): boolean => {
        const newErrors: { email?: string; password?: string } = {};

        if (!email) {
            newErrors.email = 'Please enter your email';
        } else if (!isValidEmail(email)) {
            newErrors.email = 'Please enter a valid email';
        }

        if (!password) {
            newErrors.password = 'Please enter your password';
        } else if (password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLogin = async () => {
        if (!validate()) return;

        await saveRememberMeData();
        dispatch(login({ email, password }));
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
                    {/* Header Section */}
                    <View style={styles.header}>
                        <View style={styles.logoContainer}>
                            {/* Placeholder for Logo if needed */}
                            <View style={styles.logoPlaceholder}>
                                <Ionicons name="people" size={40} color={theme.colors.primary} />
                            </View>
                        </View>
                        <Text style={styles.welcomeText}>Welcome Back!</Text>
                        <Text style={styles.subtitleText}>Sign in to continue to EffortlessHRM</Text>
                    </View>

                    {/* Form Section */}
                    <View style={styles.form}>
                        <Input
                            label="Email Address"
                            placeholder="name@company.com"
                            value={email}
                            onChangeText={(text) => {
                                setEmail(text);
                                if (errors.email) setErrors({ ...errors, email: undefined });
                            }}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            error={errors.email}
                            icon={<Ionicons name="mail-outline" size={20} color={theme.colors.gray500} />}
                        />

                        <Input
                            label="Password"
                            placeholder="Enter your password"
                            value={password}
                            onChangeText={(text) => {
                                setPassword(text);
                                if (errors.password) setErrors({ ...errors, password: undefined });
                            }}
                            secureTextEntry={!isPasswordVisible}
                            error={errors.password}
                            icon={<Ionicons name="lock-closed-outline" size={20} color={theme.colors.gray500} />}
                            rightIcon={
                                <Ionicons
                                    name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                                    size={20}
                                    color={theme.colors.gray500}
                                />
                            }
                            onRightIconPress={() => setIsPasswordVisible(!isPasswordVisible)}
                        />

                        <View style={styles.optionsRow}>
                            <TouchableOpacity
                                style={styles.rememberMeContainer}
                                onPress={() => setRememberMe(!rememberMe)}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                                    {rememberMe && <Ionicons name="checkmark" size={14} color={theme.colors.white} />}
                                </View>
                                <Text style={styles.rememberMeText}>Remember me</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => navigation.navigate('ForgotPassword')}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                            </TouchableOpacity>
                        </View>

                        <Button
                            title="Sign In"
                            onPress={handleLogin}
                            loading={isLoading}
                            style={styles.loginButton}
                        />

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Don't have an account? </Text>
                            <TouchableOpacity
                                onPress={() => navigation.navigate('Register')}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.signupLink}>Create account</Text>
                            </TouchableOpacity>
                        </View>
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
    logoContainer: {
        marginBottom: theme.spacing.lg,
    },
    logoPlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 25,
        backgroundColor: theme.colors.secondary,
        alignItems: 'center',
        justifyContent: 'center',
        ...theme.shadows.small,
    },
    welcomeText: {
        fontSize: theme.typography.fontSize.hero,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing.xs,
        textAlign: 'center',
    },
    subtitleText: {
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.textSecondary,
        textAlign: 'center',
    },
    form: {
        marginTop: theme.spacing.sm,
    },
    optionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
    },
    rememberMeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkbox: {
        width: 20,
        height: 20,
        borderWidth: 1.5,
        borderColor: theme.colors.primary,
        borderRadius: 6,
        marginRight: theme.spacing.xs,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.white,
    },
    checkboxChecked: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    rememberMeText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.textSecondary,
    },
    forgotPasswordText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.primary,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    loginButton: {
        marginBottom: theme.spacing.xl,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerText: {
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.textSecondary,
    },
    signupLink: {
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.primary,
        fontWeight: theme.typography.fontWeight.bold,
    },
});
