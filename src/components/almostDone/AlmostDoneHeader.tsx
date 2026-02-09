import * as React from "react";
import { StyleSheet } from "react-native";
import { View, Text } from "react-native-ui-lib";

export default function AlmostDoneHeader() {
    return (
        <View style={styles.headerContainer}>
            <Text h1>Almost done</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    headerContainer: {
        display: "flex",
        marginTop: 15,
        width: "100%",
        flexDirection: "column",
        alignItems: "stretch",
        color: "#212120",
    },
    headerText: {
        fontSize: 48,
        fontWeight: "900",
        lineHeight: 1,
        letterSpacing: -0.96,
    },
});