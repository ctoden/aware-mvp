import { StyleSheet } from 'react-native';
import { ButtonRegular } from '../text/ButtonRegular';

export interface PickerProps {
    children: React.ReactNode | string;
    color?: string;
    disabled?: boolean;
    error?: boolean;
    onPress?: () => void;
    placeholder?: string;
}

const baseTextStyle = {
    ...ButtonRegular,
    color: '#1A202C'
};

export const pickerStyles = StyleSheet.create({
    container: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        width: '100%',
    },
    default: {
        backgroundColor: '#FFFFFF',
        borderColor: '#E2E8F0',
    },
    hover: {
        backgroundColor: '#F7FAFC',
        borderColor: '#CBD5E0',
    },
    focused: {
        backgroundColor: '#FFFFFF',
        borderColor: '#3182CE',
    },
    disabled: {
        backgroundColor: '#EDF2F7',
        borderColor: '#E2E8F0',
        opacity: 0.6,
    },
    error: {
        backgroundColor: '#FFFFFF',
        borderColor: '#E53E3E',
    },
    // Text styles for the picker
    text: baseTextStyle,
    placeholderText: {
        color: '#A0AEC0',
    },
    disabledText: {
        ...baseTextStyle,
        color: '#718096',
    },
    errorText: {
        ...baseTextStyle,
        color: '#E53E3E',
    },
    // Icon styles
    icon: {
        width: 20,
        height: 20,
    },
    iconDisabled: {
        opacity: 0.6,
    }
});

// Helper type for style combinations
export type PickerStyleState = {
    container: object;
    text: object;
    icon?: object;
};

// Helper function to get styles based on state
export const getPickerStyles = (
    isHovered: boolean,
    isFocused: boolean,
    isDisabled: boolean,
    hasError: boolean
): PickerStyleState => {
    const containerStyles = [pickerStyles.container, pickerStyles.default];
    const textStyles = [pickerStyles.text];
    const iconStyles = [];

    if (isDisabled) {
        containerStyles.push(pickerStyles.disabled);
        textStyles.push(pickerStyles.disabledText);
        iconStyles.push(pickerStyles.iconDisabled);
    } else if (hasError) {
        containerStyles.push(pickerStyles.error);
        textStyles.push(pickerStyles.errorText);
    } else if (isFocused) {
        containerStyles.push(pickerStyles.focused);
    } else if (isHovered) {
        containerStyles.push(pickerStyles.hover);
    }

    return {
        container: StyleSheet.flatten(containerStyles),
        text: StyleSheet.flatten(textStyles),
        icon: StyleSheet.flatten(iconStyles),
    };
};