import React, { useState } from 'react';
import {
    View,
    TextInput,
    Text,
    StyleSheet,
    TextInputProps,
    TouchableOpacity,
    Animated,
} from 'react-native';
import { theme } from '../../theme';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    onRightIconPress?: () => void;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    icon,
    rightIcon,
    onRightIconPress,
    style,
    ...props
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const borderColorAnim = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        Animated.timing(borderColorAnim, {
            toValue: isFocused ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
    }, [isFocused]);

    const borderColor = borderColorAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [theme.colors.gray200, theme.colors.primary],
    });

    const backgroundColor = borderColorAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [theme.colors.gray50, theme.colors.white],
    });

    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}
            <Animated.View
                style={[
                    styles.inputContainer,
                    {
                        borderColor: error ? theme.colors.error : borderColor,
                        backgroundColor: error ? theme.colors.background : backgroundColor,
                        // @ts-ignore
                        shadowOpacity: isFocused ? theme.shadows.input.shadowOpacity : 0,
                        // @ts-ignore
                        shadowRadius: isFocused ? theme.shadows.input.shadowRadius : 0,
                        // @ts-ignore
                        elevation: isFocused ? theme.shadows.input.elevation : 0,
                    },
                    style,
                ]}
            >
                {icon && <View style={styles.iconContainer}>{icon}</View>}
                <TextInput
                    style={[styles.input, icon ? styles.inputWithIcon : null]}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholderTextColor={theme.colors.gray400}
                    selectionColor={theme.colors.primary}
                    {...props}
                />
                {rightIcon && (
                    <TouchableOpacity
                        onPress={onRightIconPress}
                        style={styles.rightIconContainer}
                        activeOpacity={0.7}
                    >
                        {rightIcon}
                    </TouchableOpacity>
                )}
            </Animated.View>
            {error && <Text style={styles.error}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: theme.spacing.lg,
    },
    label: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.xs,
        marginLeft: theme.spacing.xs,
        letterSpacing: 0.5,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderRadius: theme.borderRadius.lg,
        paddingHorizontal: theme.spacing.md,
        minHeight: 56, // Taller input area
        shadowColor: theme.shadows.input.shadowColor,
        shadowOffset: theme.shadows.input.shadowOffset,
    },
    iconContainer: {
        marginRight: theme.spacing.sm,
    },
    input: {
        flex: 1,
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.textPrimary,
        height: '100%',
    },
    inputWithIcon: {
        paddingLeft: 0,
    },
    rightIconContainer: {
        padding: theme.spacing.sm,
    },
    error: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.error,
        marginTop: theme.spacing.xs,
        marginLeft: theme.spacing.xs,
    },
});
