import { Colors, Typography, Spacings, ThemeManager } from 'react-native-ui-lib';

const spacingData = {
    page: 24,
    card: 16,
    gridGutter: 16,
    section: 32,
    s1: 4,
    s2: 8,
    s3: 12,
    s4: 16,
    s5: 20,
    s6: 24,
    s7: 32,
    s8: 40,
    s9: 48,
    s10: 64,
}

export const customColors = {
    beige1: '#FOEBE4',
    beige2: '#E1DCCE',
    beige3: '#D4C7B6',
    beige4: '#E0E0E0',
    beige5: '#E1DCCE',
    black1: '#212120',
    black2: '#333333',
    black3: '#545452',
    beige2Alpha60: '#E1DCCE99',
    blackAlpha60: '#00000066',
    white: '#F2F2F2',
    lime: '#B2C85D',
    limeDeep: '#596723',
    salmon: '#FF899F',
    yellow: '#FECF51',
    marigold: '#EAB045',
    marigoldDeep: '#845806',
    red: '#ED5F36',
    redDeep: '#C22900',
    blueLight: '#97B5F5',
    blue: '#4791EE',
    blueDeep: '#255FA9',
    seafoam: '#65B59B',
    seafoamDeep: '#246A63',
    softsand: '#eee8e0',
    orchid: '#C980C6',
    lavender: '#A181E3',
    purple: '#7B40C6',
    gray2: '#666666',
}

export const elementColors = {
    input: customColors.beige4,
    inputBackground: customColors.beige5,
    inputBorderColor: customColors.beige3
}

export const topQualityColors = {
    extraverted: customColors.lime,
    extraversion: customColors.lime,
    emotionalStability: customColors.salmon,
    agreeableness: customColors.marigold,
    spirituality: customColors.orchid,
    honestyHumility: customColors.seafoam,
    conscientiousness: customColors.red,
    rationality: customColors.blue,
    openness: customColors.lavender,
}
export const SVGIcons = {
    TrashCan: require('@assets/images/trash-can.svg'),
    Logout: require('@assets/images/trash-can.svg'),
}

export const Images = {
    
}

// Design Tokens - Colors
Colors.loadColors({
    // Primary palette
    primary: '#422040',
    secondary: '#a9cbb7',
    accent: '#F7ff58',

    // Semantic colors
    success: '#4CAF50',
    error: '#E63B2E',
    warning: '#FF963C',

    // Background colors
    backgroundDefault: '#D4C7B6',
    backgroundLight: '#FAF9F6',
    backgroundDark: '#D4C7B6',
    backgroundAccent: '#e1dcce',

    // Text colors
    textPrimary: '#2b2b2b',
    textSecondary: '#666666',
    textDisabled: '#999999',

    // Legacy colors (kept for backward compatibility)
    communicationSkillsColor: "#422040",
    empathyColor: "#a9cbb7",
    flexibilityColor: "#F7ff58",
    patienceColor: "#ff934F",
    trustworthinessColor: "#5e565a",
});

// Typography Presets
Typography.loadTypographies({
    // Headings
    h1: { fontSize: 48, fontWeight: '700', lineHeight: 44, fontFamily: 'WorkSansBlack', letterSpacing: -0.96 },
    h2: { fontSize: 24, fontWeight: '700', lineHeight: 30, fontFamily: 'WorkSansSemiBold' },
    h3: { fontSize: 24, fontWeight: '700', lineHeight: 34, fontFamily: 'WorkSansBold' },
    h4: { fontSize: 16, fontWeight: '600', lineHeight: 24, fontFamily: 'WorkSansSemiBold' },

    // intro
    introHero: { fontSize: 48, fontWeight: '700', lineHeight: 44, fontFamily: 'WorkSansBlack' },
    introLogoTxt: { color: '#F0EBE4', fontFamily: 'PoetsenOne', fontSize: 56, fontWeight: '400', lineHeight: 26, letterSpacing: -1.687 },

    // Body text
    bodyL: { fontSize: 16, fontWeight: '400', lineHeight: 24, fontFamily: 'WorkSans', letterSpacing: -0.3 },
    bodyM: { fontSize: 14, fontWeight: '400', lineHeight: 24, fontFamily: 'WorkSans', letterSpacing: -0.3 },
    bodyLBold: { fontSize: 16, fontWeight: '700', lineHeight: 24, fontFamily: 'WorkSansBold', letterSpacing: -0.3 },
    bodyMBold: { fontSize: 14, fontWeight: '700', lineHeight: 24, fontFamily: 'WorkSansBold', letterSpacing: -0.3 },
    bodyRegular: { fontSize: 16, fontWeight: '400', lineHeight: 24, fontFamily: 'WorkSans', letterSpacing: -0.5 },

    // button text
    buttonRegular: { fontSize: 16, fontWeight: '400', lineHeight: 20, fontFamily: 'WorkSansSemiBold', letterSpacing: -0.1 },

    // label text
    labelText: { fontSize: 12, fontWeight: '400', lineHeight: 18, fontFamily: 'WorkSans', fontStyle: 'normal' },
    labelSecondary: { fontSize: 12, fontWeight: '400', lineHeight: 18, fontFamily: 'WorkSans', fontStyle: 'normal', color: customColors.black3, textAlign: 'right' },
    // Special fonts
    joeSlab: { fontFamily: 'JosefinSlab', fontWeight: '300' },
    inter: { fontFamily: 'Inter', fontWeight: '300' },
});


// Spacing Presets
Spacings.loadSpacings(spacingData);

// Component Themes
ThemeManager.setComponentTheme('Card', {
    borderRadius: 12,
    padding: spacingData.card,
    backgroundColor: Colors.backgroundLight,
});

ThemeManager.setComponentTheme('Button', {
    borderRadius: 50,
    height: 57,
    paddingHorizontal: Spacings.s6,
    backgroundColor: Colors.textPrimary,
});

ThemeManager.setComponentTheme('Text', {
    color: Colors.textPrimary,
    ...Typography.bodyL
});

// Export theme configuration
export const colorScheme = {
    light: {
        text: Colors.textPrimary,
        background: customColors.beige1,
        tint: Colors.primary,
        tabIconDefault: Colors.textSecondary,
        tabIconSelected: Colors.primary,
    },
    dark: {
        text: Colors.backgroundLight,
        background: Colors.textPrimary,
        tint: Colors.backgroundLight,
        tabIconDefault: Colors.textSecondary,
        tabIconSelected: Colors.backgroundLight,
    },
};

const themeObject = {
    colors: Colors,
    typography: Typography,
    spacings: Spacings,
    colorScheme,
};

export default themeObject;