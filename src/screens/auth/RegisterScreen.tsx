import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Linking,
} from 'react-native';
import { StatusBar } from 'react-native';
import { theme } from '../../theme';
import { PORTAL_BASE_URL } from '../../utils/constants';

export const RegisterScreen = ({ navigation }: any) => {
    const handleRegister = () => {
        Linking.openURL(`${PORTAL_BASE_URL}#/register`);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
            <View style={styles.content}>
                <Text style={styles.title}>Create Account</Text>
                <Text style={styles.message}>
                    Please visit our web portal to create a new account
                </Text>
                <TouchableOpacity style={styles.button} onPress={handleRegister}>
                    <Text style={styles.buttonText}>Open Web Portal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.navigate('Login')}
                >
                    <Text style={styles.backButtonText}>Back to Login</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.lg,
    },
    title: {
        fontSize: theme.typography.fontSize.hero,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing.md,
    },
    message: {
        fontSize: theme.typography.fontSize.lg,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginBottom: theme.spacing.xl,
    },
    button: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        ...theme.shadows.medium,
    },
    buttonText: {
        color: theme.colors.white,
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
    },
    backButton: {
        marginTop: theme.spacing.lg,
    },
    backButtonText: {
        color: theme.colors.primary,
        fontSize: theme.typography.fontSize.md,
        textDecorationLine: 'underline',
    },
});
