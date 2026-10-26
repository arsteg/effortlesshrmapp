import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { theme } from '../../theme';

interface CardProps {
    children: React.ReactNode;
    // StyleProp (not a bare ViewStyle) so callers can pass an array of
    // styles to combine, matching Button's existing style prop convention.
    style?: StyleProp<ViewStyle>;
    elevated?: boolean;
    variant?: 'default' | 'outlined' | 'flat';
}

export const Card: React.FC<CardProps> = ({
    children,
    style,
    elevated = true,
    variant = 'default'
}) => {
    return (
        <View style={[
            styles.card,
            variant === 'default' && styles.defaultCard,
            variant === 'outlined' && styles.outlinedCard,
            variant === 'flat' && styles.flatCard,
            elevated && variant === 'default' && theme.shadows.medium,
            style
        ]}>
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg, // Increased padding
    },
    defaultCard: {
        // Shadow is applied via style prop conditionally
        borderWidth: 0,
    },
    outlinedCard: {
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.white,
    },
    flatCard: {
        backgroundColor: theme.colors.backgroundSecondary,
        borderWidth: 0,
    }
});
