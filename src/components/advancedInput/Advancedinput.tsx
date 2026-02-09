import * as React from 'react';
import { View, Text, TextInput } from 'react-native';
import { AdvancedInputProps } from './types';
import { createStyles } from './styles';

export const AdvancedInput: React.FC<AdvancedInputProps> = ({
    label,
    errorMessage,
    value,
    onChange,
    placeholder,
    disabled = false,
    maxLength,
    autoFocus = false,
    testID,
}) => {
    const inputId = React.useId();
    const styles = createStyles({ hasError: !!errorMessage, disabled });

    return (
        <View style={styles.container}>
            <View style={styles.labelContainer}>
                <Text
                    style={styles.label}
                    nativeID={`${inputId}-label`}
                    accessibilityRole="text"
                >
                    {label}
                </Text>
                {errorMessage && (
                    <Text
                        style={styles.errorText}
                        nativeID={`${inputId}-error`}
                        accessibilityRole="alert"
                    >
                        {errorMessage}
                    </Text>
                )}
            </View>
            <TextInput
                style={styles.input}
                value={value}
                onChangeText={onChange}
                placeholder={placeholder}
                editable={!disabled}
                maxLength={maxLength}
                autoFocus={autoFocus}
                testID={testID}
                accessibilityLabel={label}
                accessibilityLabelledBy={`${inputId}-label`}
                accessibilityState={{
                    disabled,
                }}
            />
        </View>
    );
};