import * as React from "react";
import { View, Text, StyleSheet, useWindowDimensions, Platform } from "react-native";
import type { WelcomeHeaderProps } from "./types";
import { H1 } from "../text/H1";
import { BodyRegular } from "../text/BodyRegular";

export const WelcomeHeader: React.FC<WelcomeHeaderProps> = ({
    userName,
    emoji,
    message
}) => {
    return (
        <View style={styles.headerContainer}>
            <View style={styles.emojiContainer}>
                <Text style={styles.emojiText}>{emoji}</Text>
            </View>
            <View style={styles.welcomeTextContainer}>
                <H1>Welcome,{'\n'}{userName}!</H1>
            </View>
            <View style={styles.messageContainer}>
                <BodyRegular>{message}</BodyRegular>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    headerContainer: {
        display: "flex",
        marginTop: Platform.OS === 'ios' ? 5 : 15,
        width: "100%",
        flexDirection: "column",
        alignItems: "stretch",
        fontFamily: "Work Sans, sans-serif",
        fontSize: 48,
        color: "#212120",
        ...(Platform.OS === 'ios' && {
            maxHeight: '60%',
        }),
    },
    emojiContainer: {
        alignItems: 'flex-start'
    },
    emojiText: {
        color: "rgba(33, 33, 32, 1)",
        lineHeight: 24,
        fontSize: 32,
    },
    welcomeTextContainer: {
        marginTop: Platform.OS === 'ios' ? 8 : 16,
    },
    welcomeText: {
        fontSize: 48,
        fontWeight: "900",
        lineHeight: 44,
        letterSpacing: -0.96,
    },
    messageContainer: {
        marginTop: Platform.OS === 'ios' ? 8 : 16,
    },
    messageText: {
        fontSize: 16,
        fontWeight: "400",
        lineHeight: 24,
        letterSpacing: -0.24,
    }
});