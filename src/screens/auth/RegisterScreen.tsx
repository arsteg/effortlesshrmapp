import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Linking,
    Animated,
    Dimensions,
} from 'react-native';
import { StatusBar } from 'react-native';
import { theme } from '../../theme';
import { PORTAL_BASE_URL } from '../../utils/constants';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/common/Button';

const { width } = Dimensions.get('window');

export const RegisterScreen = ({ navigation }: any) => {
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

    const handleRegister = () => {
        Linking.openURL(`${PORTAL_BASE_URL}#/register`);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
            <Animated.View
                style={[
                    styles.content,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                    },
                ]}
            >
                <View style={styles.iconContainer}>
                    <Ionicons name="person-add-outline" size={48} color={theme.colors.primary} />
                </View>

                <Text style={styles.title}>Join EffortlessHRM</Text>

                <Text style={styles.message}>
                    To ensure the best experience, account creation is currently available through our web portal.
                </Text>

                <Button
                    title="Open Web Portal"
                    onPress={handleRegister}
                    style={styles.button}
                    icon={<Ionicons name="globe-outline" size={20} color={theme.colors.white} />}
                />

                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.navigate('Login')}
                    activeOpacity={0.7}
                >
                    <Text style={styles.backButtonText}>Back to Sign In</Text>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        justifyContent: 'center',
    },
    content: {
        padding: theme.spacing.xl,
        alignItems: 'center',
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center',
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: theme.colors.secondary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: theme.spacing.xl,
        ...theme.shadows.small,
    },
    title: {
        fontSize: theme.typography.fontSize.header,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing.md,
        textAlign: 'center',
    },
    message: {
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginBottom: theme.spacing.xxl,
        lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.md,
    },
    button: {
        width: '100%',
        marginBottom: theme.spacing.lg,
    },
    backButton: {
        padding: theme.spacing.sm,
    },
    backButtonText: {
        color: theme.colors.primary,
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.semibold,
    },
});
