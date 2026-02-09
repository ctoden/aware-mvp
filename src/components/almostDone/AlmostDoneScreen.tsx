import * as React from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import AlmostDoneHeader from "./AlmostDoneHeader";
import AlmostDoneBody from "./AlmostDoneBody";
import AlmostDoneFooter from "./AlmostDoneFooter";
import { AwareBall } from "@app/components/AwareBall";

export default function AlmostDoneScreen() {
    const { height } = useWindowDimensions();
    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <AlmostDoneHeader />
                <AlmostDoneBody />
            </View>
            <AlmostDoneFooter />
            <View style={[styles.awareBall, { top: height - (600 / 2) }]}>
                <AwareBall step={2} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        display: "flex",
        marginLeft: "auto",
        marginRight: "auto",
        width: "100%",
        height: "100%",
        padding: 20,
        flexDirection: "column",
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "space-between",
    },
    headerContainer: {
        rowGap: 0,
    },
    awareBall: {
        position: "absolute",
        top: 0,
        left: 0,
        zIndex: -1,
        width: "100%",
        height: "100%",
    }
});
