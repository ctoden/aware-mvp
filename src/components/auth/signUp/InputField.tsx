import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, Platform } from "react-native";
import { InputFieldProps } from "./types";
import { ReactiveTextField } from "@src/components";
import { customColors } from "@app/constants/theme";

export const InputField: React.FC<InputFieldProps> = ({
    label,
    value,
    prefix,
    onChange,
    type = "text",
    id,
    testID,
    onBlur,
    error,
    secureTextEntry,
    onKeyPress,
    textContentType,
    autoCapitalize="none",
    onFocus,
}) => {
    // For password fields, temporarily toggle secure entry on focus.
    const [isSecureEntry, setIsSecureEntry] = useState<boolean>(
        secureTextEntry || type === "password"
    );

    const handleFocus = (e: any) => {
        if (type === "password") {
            setIsSecureEntry(false);
            // Re-enable secureTextEntry after a short delay to avoid triggering autofill.
            setTimeout(() => setIsSecureEntry(true), 1000);
        }
        if (onFocus) {
            onFocus(e);
        }
    };


    return (
        <View style={styles.inputContainer}>
            <Text style={styles.inputLabel} nativeID={`${id}Label`}>
                {label}
            </Text>
            <View style={[styles.inputWrapper, error && styles.inputWrapperError]}>
                {prefix && <Text style={styles.prefix}>{prefix}</Text>}
                <ReactiveTextField
                    style={styles.input}
                    value$={value}
                    onChangeText={onChange}
                    testID={testID}
                    accessibilityLabel={label}
                    accessibilityLabelledBy={`${id}Label`}
                    keyboardType={
                        type === "email"
                            ? "email-address"
                            : type === "tel"
                                ? "phone-pad"
                                : "default"
                    }
                    secureTextEntry={
                        type === "password" ? isSecureEntry : secureTextEntry || false
                    }
                    textContentType={
                        type === "tel"
                            ? "telephoneNumber"
                            : type === "password"
                                ? "none"
                                : textContentType
                    }
                    onBlur={onBlur}
                    onKeyPress={onKeyPress}
                    onFocus={handleFocus}
                    autoCapitalize={autoCapitalize}
                />
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    inputContainer: {
        width: "100%",
        marginTop: 16,
    },
    inputLabel: {
        color: "rgba(84, 84, 82, 1)",
        fontSize: 12,
        fontWeight: "400",
        letterSpacing: -0.12,
    },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 24,
        marginTop: 8,
        paddingHorizontal: 16,
        paddingVertical: 0,
        backgroundColor: customColors.beige2,
    },
    inputWrapperError: {
        borderColor: "red",
        borderWidth: 1,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: "rgba(33, 33, 32, 1)",
        letterSpacing: -0.3,
        paddingVertical: 16,
        ...Platform.select({
            ios: {
                outlineStyle: 'none',
            },
            android: {
                outlineStyle: 'none',
            },
            web: {
                outlineStyle: 'none',
            },
        }),
    },
    prefix: {
        fontSize: 16,
        fontWeight: "800",
        marginRight: 4,
        color: "rgba(33, 33, 32, 1)",
    },
    errorText: {
        color: "red",
        fontSize: 12,
        marginTop: 4,
        marginLeft: 16,
    },
});
