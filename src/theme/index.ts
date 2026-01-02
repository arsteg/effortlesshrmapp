export const colors = {
    // Brand Colors - Vibrant Teal & Deep Blue
    primary: '#0CD3D0',   // Vibrant Teal
    secondary: '#E7FBFA', // Soft Teal Bg
    accent: '#2D3436',    // Dark Charcoal for strong accents
    
    // Extended palette
    primaryDark: '#09B0AE',
    primaryLight: '#5EE3E1',
    primarySoft: 'rgba(12, 211, 208, 0.15)', // For soft backgrounds

    // Semantic colors
    success: '#00B894', // Mint Green
    warning: '#FDCB6E', // Sun Yellow
    error: '#FF7675',   // Soft Red
    info: '#74B9FF',    // Sky Blue

    // Chart colors
    productive: '#6C5CE7',    // Purple
    nonProductive: '#FAB1A0', // Peach
    neutral: '#DFE6E9',       // Light Gray
    closed: '#55EFC4',        // Mint

    // Neutrals
    white: '#FFFFFF',
    black: '#1E272E', // Soft Black
    gray50: '#FAFBFC',
    gray100: '#F1F3F6', // Light grayish blue
    gray200: '#DFE4EA',
    gray300: '#CED6E0',
    gray400: '#A4B0BE',
    gray500: '#747D8C', // Muted text
    gray600: '#57606F',
    gray700: '#2F3542',
    gray800: '#1E272E',
    gray900: '#000000',

    // Background
    background: '#FFFFFF',
    backgroundSecondary: '#F8F9FA', // Very subtle gray for page backgrounds
    surface: '#FFFFFF',

    // Text
    textPrimary: '#2D3436',   // Strong Dark Gray (Better than pure black)
    textSecondary: '#636E72', // Medium Gray
    textDisabled: '#B2BEC3',

    // Border
    border: '#DFE6E9',
    borderLight: '#F1F3F6',
};

export const spacing = {
    xs: 6,
    sm: 10,
    md: 18,
    lg: 26,
    xl: 36,
    xxl: 52,
};

export const borderRadius = {
    sm: 8,
    md: 14,
    lg: 20,
    xl: 28,
    round: 999,
};

export const shadows = {
    small: {
        shadowColor: '#2D3436',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    medium: {
        shadowColor: '#2D3436',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
        elevation: 6,
    },
    large: {
        shadowColor: '#2D3436',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 12,
    },
    input: {
        shadowColor: '#0CD3D0',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 2,
    }
};

export const typography = {
    // If you add a custom font later, update 'System' to the font name like 'Inter-Regular'
    fontFamily: {
        regular: 'System', 
        medium: 'System',
        bold: 'System',
    },
    fontSize: {
        xs: 12,
        sm: 13,
        md: 15, // Slightly larger base size for readability
        lg: 17,
        xl: 20,
        xxl: 24,
        title: 28,
        header: 32,
        hero: 40,
    },
    fontWeight: {
        regular: '400' as const,
        medium: '500' as const,
        semibold: '600' as const,
        bold: '700' as const,
    },
    lineHeight: {
        tight: 1.25,
        normal: 1.6,
        relaxed: 1.75,
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
