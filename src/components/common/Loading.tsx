import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { theme } from '../../theme';

interface LoadingProps {
    message?: string;
}

export const Loading: React.FC<LoadingProps> = ({ message }) => {
    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            {message && <Text style={styles.message}>{message}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
    },
    message: {
        marginTop: theme.spacing.md,
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.textSecondary,
    },
});
