export const colors = {
    primary: '#0cd3d0',
    secondary: '#e7fbfa',

    // Extended palette
    primaryDark: '#0ab3b0',
    primaryLight: '#5ee3e1',

    // Semantic colors
    success: '#08AD08',
    warning: '#FFBE5B',
    error: '#FF4444',
    info: '#7aa3e5',

    // Chart colors
    productive: '#a8385d',
    nonProductive: '#a27ea8',
    neutral: '#7aa3e5',
    closed: '#00fa9a',

    // Neutrals
    white: '#FFFFFF',
    black: '#000000',
    gray50: '#FAFAFA',
    gray100: '#F5F5F5',
    gray200: '#EEEEEE',
    gray300: '#E0E0E0',
    gray400: '#BDBDBD',
    gray500: '#9E9E9E',
    gray600: '#757575',
    gray700: '#616161',
    gray800: '#424242',
    gray900: '#212121',

    // Background
    background: '#FFFFFF',
    backgroundSecondary: '#F5F5F5',

    // Text
    textPrimary: '#212121',
    textSecondary: '#757575',
    textDisabled: '#BDBDBD',

    // Border
    border: '#E0E0E0',
    borderLight: '#F5F5F5',
};

export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

export const borderRadius = {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    round: 999,
};

export const shadows = {
    small: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    medium: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
    },
    large: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
    },
};

export const typography = {
    fontFamily: {
        regular: 'System',
        medium: 'System',
        bold: 'System',
    },
    fontSize: {
        xs: 10,
        sm: 12,
        md: 14,
        lg: 16,
        xl: 18,
        xxl: 20,
        title: 24,
        header: 28,
        hero: 32,
    },
    fontWeight: {
        regular: '400' as const,
        medium: '500' as const,
        semibold: '600' as const,
        bold: '700' as const,
    },
    lineHeight: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.7,
    },
};

export const theme = {
    colors,
    spacing,
    borderRadius,
    shadows,
    typography,
};

export type Theme = typeof theme;
export type Colors = typeof colors;
export type Spacing = typeof spacing;
