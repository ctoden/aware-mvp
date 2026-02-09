import React, { FC, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { PickerProps, getPickerStyles } from './types';
import { ChevronDownIcon } from '../icons/ChevronDownIcon'; // Assuming you have this icon

export const Picker: FC<PickerProps> = ({
    children,
    disabled = false,
    error = false,
    color,
    onPress,
    placeholder = 'Select an option'
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const styles = getPickerStyles(isHovered, isFocused, disabled, error);

    const handlePress = () => {
        if (!disabled && onPress) {
            onPress();
        }
    };

    return (
        <Pressable
            onPress={handlePress}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onHoverIn={() => setIsHovered(true)}
            onHoverOut={() => setIsHovered(false)}
            style={styles.container}
            disabled={disabled}
            accessible={!disabled}
            accessibilityRole="button"
            accessibilityState={{ disabled }}
        >
            <Text style={styles.text}>
                {children || placeholder}
            </Text>
            <ChevronDownIcon style={styles.icon} color={color} />
        </Pressable>
    );
};