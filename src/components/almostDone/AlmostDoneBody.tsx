import * as React from "react";
import { View, StyleSheet, Text } from "react-native";

export default function AlmostDoneBody() {
    return (
        <View style={styles.bodyContainer}>
            <Text style={styles.bodyText}>
                Your profile is shaping up nicely. It's great to get to know you!
            </Text>
            <Text style={[styles.bodyText, { marginTop: 10 }]}>
                Many of the following questions are optional—the more you add, the smarter Aware gets. 🤓 That means you'll have even more opportunities
                for hyper-personalized insights.
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    bodyContainer: {
        fontSize: 16,
        fontWeight: "400",
        lineHeight: 24,
        letterSpacing: -0.24,
        marginTop: 16,
    },
    bodyText: {},
});