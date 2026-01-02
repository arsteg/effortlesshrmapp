import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
    TextStyle,
    Animated,
    View,
} from 'react-native';
import { theme } from '../../theme';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    loading?: boolean;
    disabled?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
    icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    loading = false,
    disabled = false,
    style,
    textStyle,
    icon,
}) => {
    const scaleValue = React.useRef(new Animated.Value(1)).current;
    const isDisabled = disabled || loading;

    const handlePressIn = () => {
        Animated.spring(scaleValue, {
            toValue: 0.96,
            useNativeDriver: true,
            speed: 50,
            bounciness: 4,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleValue, {
            toValue: 1,
            useNativeDriver: true,
            speed: 50,
            bounciness: 4,
        }).start();
    };

    return (
        <Animated.View style={[{ transform: [{ scale: scaleValue }] }, style]}>
            <TouchableOpacity
                style={[
                    styles.button,
                    variant === 'primary' && styles.primaryButton,
                    variant === 'secondary' && styles.secondaryButton,
                    variant === 'outline' && styles.outlineButton,
                    variant === 'ghost' && styles.ghostButton,
                    isDisabled && styles.disabledButton,
                ]}
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={isDisabled}
                activeOpacity={0.9}
            >
                {loading ? (
                    <ActivityIndicator
                        color={variant === 'outline' || variant === 'ghost' ? theme.colors.primary : theme.colors.white}
                    />
                ) : (
                    <View style={styles.contentContainer}>
                        {icon && <View style={styles.iconContainer}>{icon}</View>}
                        <Text
                            style={[
                                styles.text,
                                variant === 'primary' && styles.primaryText,
                                variant === 'secondary' && styles.secondaryText,
                                variant === 'outline' && styles.outlineText,
                                variant === 'ghost' && styles.ghostText,
                                isDisabled && styles.disabledText,
                                textStyle,
                            ]}
                        >
                            {title}
                        </Text>
                    </View>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    button: {
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.xl,
        borderRadius: theme.borderRadius.round, // Pill shape
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 56, // Taller touch target
        flexDirection: 'row',
    },
    contentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        marginRight: theme.spacing.sm,
    },
    primaryButton: {
        backgroundColor: theme.colors.primary,
        ...theme.shadows.medium,
        shadowColor: theme.colors.primary, // Colored shadow for glow effect
        shadowOpacity: 0.25,
    },
    secondaryButton: {
        backgroundColor: theme.colors.secondary,
        // ...theme.shadows.small,
    },
    outlineButton: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: theme.colors.primary,
    },
    ghostButton: {
        backgroundColor: 'transparent',
    },
    disabledButton: {
        backgroundColor: theme.colors.gray200,
        elevation: 0,
        shadowOpacity: 0,
    },
    text: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.semibold,
        letterSpacing: 0.5,
    },
    primaryText: {
        color: theme.colors.white,
    },
    secondaryText: {
        color: theme.colors.primaryDark,
    },
    outlineText: {
        color: theme.colors.primary,
    },
    ghostText: {
        color: theme.colors.primary,
    },
    disabledText: {
        color: theme.colors.gray500,
    },
});
