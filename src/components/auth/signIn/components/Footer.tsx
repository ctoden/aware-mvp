import * as React from "react";
import { Text, TouchableOpacity, StyleSheet } from "react-native";

interface FooterProps {
    onCreateAccount: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onCreateAccount }) => {
    return (
        <TouchableOpacity
            onPress={onCreateAccount}
            accessibilityLabel="Create account link"
            accessibilityRole="link"
        >
            <Text style={styles.text}>
                Don't have an account, create one here
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    text: {
        color: "#000",
        textAlign: "center",
        fontSize: 12,
        fontWeight: "500",
        textDecorationLine: "underline",
        marginTop: 10,
        width: "100%",
    },
});