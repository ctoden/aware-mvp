import React from 'react';
import { 
    TouchableOpacity, 
    Text, 
    StyleSheet, 
    ViewStyle, 
    TextStyle, 
    ActivityIndicator 
} from 'react-native';
import { Colors, Typography } from 'react-native-ui-lib';

interface ButtonProps {
    title: string;
    onPress: () => void;
    disabled?: boolean;
    loading?: boolean;
    variant?: 'primary' | 'secondary';
    style?: ViewStyle;
    textStyle?: TextStyle;
}

const Button: React.FC<ButtonProps> = ({ 
    title, 
    onPress, 
    disabled = false, 
    loading = false,
    variant = 'primary',
    style,
    textStyle
}) => {
    const buttonStyles = [
        styles.button,
        variant === 'primary' ? styles.primaryButton : styles.secondaryButton,
        disabled && styles.disabledButton,
        style
    ];

    const textStyles = [
        styles.text,
        variant === 'primary' ? styles.primaryText : styles.secondaryText,
        disabled && styles.disabledText,
        textStyle
    ];

    return (
        <TouchableOpacity
            style={buttonStyles}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.8}
        >
            {loading ? (
                <ActivityIndicator 
                    color={variant === 'primary' ? '#FFFFFF' : '#2B2B2B'} 
                />
            ) : (
                <Text style={textStyles}>{title}</Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        height: 57,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 8,
        display: 'flex',
        gap: 8,
        flexShrink: 0,
    },
    primaryButton: {
        backgroundColor: '#2B2B2B',
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#2B2B2B',
    },
    disabledButton: {
        backgroundColor: Colors.darkBackground,
        borderColor: Colors.darkBackground,
    },
    text: {
        ...Typography.inter,
        fontSize: 16,
        fontWeight: '500',
    },
    primaryText: {
        color: '#FFFFFF',
    },
    secondaryText: {
        color: '#2B2B2B',
    },
    disabledText: {
        color: Colors.background,
    },
});

export default Button;
