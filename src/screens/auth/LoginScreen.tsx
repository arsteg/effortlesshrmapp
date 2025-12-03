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

export const LoginScreen = ({ navigation }: any) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

    const dispatch = useAppDispatch();
    //const { isLoading, error } = useAppSelector((state) => state.auth);
    const isLoading= false;
    const error= null;
    useEffect(() => {
        loadRememberMeData();
    }, []);

    useEffect(() => {
        if (error) {
            Alert.alert('Login Failed', error);
        }
    }, [error]);

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
           <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerText}>EffortlessHRM</Text>
                </View>

                {/* Form Container */}
                <View style={styles.formContainer}>
                    <View style={styles.form}>
                        {/* Email Input */}
                        <Input
                            label="Email Address"
                            placeholder="Enter your email"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            error={errors.email}
                            icon={<Ionicons name="mail-outline" size={20} color={theme.colors.gray500} />}
                        />

                        {/* Password Input */}
                        <Input
                            label="Password"
                            placeholder="Enter your password"
                            value={password}
                            onChangeText={setPassword}
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

                        {/* Remember Me and Forgot Password */}
                        <View style={styles.optionsRow}>
                            <TouchableOpacity
                                style={styles.rememberMeContainer}
                                onPress={() => setRememberMe(!rememberMe)}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                                    {rememberMe && <Ionicons name="checkmark" size={16} color={theme.colors.white} />}
                                </View>
                                <Text style={styles.rememberMeText}>Remember Me</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => navigation.navigate('ForgotPassword')}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Login Button */}
                        <Button
                            title="Login"
                            onPress={handleLogin}
                            loading={isLoading}
                            style={styles.loginButton}
                        />

                        {/* Sign Up Link */}
                        <View style={styles.signupContainer}>
                            <Text style={styles.signupText}>Don't have an account? </Text>
                            <TouchableOpacity
                                onPress={() => navigation.navigate('Register')}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.signupLink}>Sign up</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
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
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 150,
    },
    headerText: {
        fontSize: theme.typography.fontSize.hero,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.white,
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
    form: {
        marginTop: theme.spacing.md,
    },
    optionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    rememberMeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkbox: {
        width: 20,
        height: 20,
        borderWidth: 2,
        borderColor: theme.colors.primary,
        borderRadius: 4,
        marginRight: theme.spacing.xs,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxChecked: {
        backgroundColor: theme.colors.primary,
    },
    rememberMeText: {
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.primary,
    },
    forgotPasswordText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.primary,
        textDecorationLine: 'underline',
    },
    loginButton: {
        marginTop: theme.spacing.md,
    },
    signupContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: theme.spacing.xl,
    },
    signupText: {
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.textSecondary,
    },
    signupLink: {
        fontSize: theme.typography.fontSize.lg,
        color: theme.colors.primary,
        fontWeight: theme.typography.fontWeight.bold,
        textDecorationLine: 'underline',
    },
});
