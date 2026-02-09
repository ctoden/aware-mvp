import * as React from "react";
import {StyleSheet} from "react-native";
import {Image, Text, View} from "react-native-ui-lib";
import {CoreValueProps} from "./types";
import {customColors} from "@app/constants/theme"
import AiMagicIcon from "../icons/AiMagicIcon";

interface CoreValueCardProps {
    value: CoreValueProps;
}

export const CoreValueCard: React.FC<CoreValueCardProps> = ({value}) => {
    return (
        <View flex marginT-8 padding-16 width="100%" style={styles.qualityContainer}>
            <View flex row style={styles.headerContainer}>
                <View style={styles.titleContainer}>
                    <Text style={styles.titleText}>{value.title}</Text>
                </View>
                <AiMagicIcon 
                    style={styles.icon}
                    accessibilityLabel={`${value.title} icon`}
                />
            </View>
            <View style={styles.descriptionContainer}>
                <Text style={styles.descriptionText}>{value.description}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    qualityContainer: {
        backgroundColor: customColors.beige2,
        borderRadius: 16,
        flexDirection: "column",
        overflow: "hidden",
        gap: 12,
        justifyContent: "space-between",
    },
    headerContainer: {
        display: "flex",
        width: "100%",
        gap: "40px 100px",
        justifyContent: "space-between",
    },
    titleContainer: {},
    titleText: {
        fontSize: 20,
        fontWeight: "600",
        lineHeight: 26,
        letterSpacing: -0.4,
        color: "#212120",
    },
    icon: {
        alignSelf: "stretch",
        position: "relative",
        display: "flex",
        marginTop: "auto",
        marginBottom: "auto",
        width: 18,
        aspectRatio: 1,
    },
    descriptionContainer: {
        marginTop: 0,
    },
    descriptionText: {
        color: "#212120",
        fontSize: 16,
        fontWeight: "400",
        lineHeight: 18,
        letterSpacing: -0.24,
    },
});