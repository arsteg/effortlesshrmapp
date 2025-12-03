import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
    TextStyle,
} from 'react-native';
import { theme } from '../../theme';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
    loading?: boolean;
    disabled?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    loading = false,
    disabled = false,
    style,
    textStyle,
}) => {
    const isDisabled = disabled || loading;

    return (
        <TouchableOpacity
            style={[
                styles.button,
                variant === 'primary' && styles.primaryButton,
                variant === 'secondary' && styles.secondaryButton,
                variant === 'outline' && styles.outlineButton,
                isDisabled && styles.disabledButton,
                style,
            ]}
            onPress={onPress}
            disabled={isDisabled}
            activeOpacity={0.7}
        >
            {loading ? (
                <ActivityIndicator
                    color={variant === 'outline' ? theme.colors.primary : theme.colors.white}
                />
            ) : (
                <Text
                    style={[
                        styles.text,
                        variant === 'primary' && styles.primaryText,
                        variant === 'secondary' && styles.secondaryText,
                        variant === 'outline' && styles.outlineText,
                        isDisabled && styles.disabledText,
                        textStyle,
                    ]}
                >
                    {title}
                </Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 48,
    },
    primaryButton: {
        backgroundColor: theme.colors.primary,
        ...theme.shadows.small,
    },
    secondaryButton: {
        backgroundColor: theme.colors.secondary,
        ...theme.shadows.small,
    },
    outlineButton: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: theme.colors.primary,
    },
    disabledButton: {
        backgroundColor: theme.colors.gray300,
        opacity: 0.6,
    },
    text: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
    },
    primaryText: {
        color: theme.colors.white,
    },
    secondaryText: {
        color: theme.colors.primary,
    },
    outlineText: {
        color: theme.colors.primary,
    },
    disabledText: {
        color: theme.colors.gray500,
    },
});
