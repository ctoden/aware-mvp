import { customColors } from "@app/constants/theme";
import * as React from "react";
import { View, StyleSheet, Text, TouchableOpacity } from "react-native";
import {router} from "expo-router";

export default function AlmostDoneFooter() {
    return (
        <View style={styles.footerContainer}>
            <TouchableOpacity style={styles.footerButton} onPress={() => router.navigate("/MainInterests")}>
                <Text style={styles.footerText}>Let's finish this!</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    footerContainer: {
        alignSelf: "center",
        justifyContent: "center",
        borderRadius: 50,
        minHeight: 56,
        width: "100%",
        maxWidth: 600,
        minWidth: 360,
        paddingLeft: 24,
        paddingRight: 24,
        paddingTop: 18,
        paddingBottom: 18,
        gap: 4,
        overflow: "hidden",
        fontSize: 16,
        letterSpacing: -0.16,
        lineHeight: 1,
    },
    footerButton: {
        backgroundColor: customColors.black1,
        borderRadius: 25,
        minHeight: 50,
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
    },
    footerText: {
        color: "#F0EBE4",
        fontWeight: "600",
        textAlign: "center",
    },
});