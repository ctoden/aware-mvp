import * as React from "react";
import { View, StyleSheet, Text } from "react-native";
import { SimpleListCardProps } from "./types";
import { customColors } from "@app/constants/theme";

export const SimpleListCard: React.FC<SimpleListCardProps> = ({ title, description, IconComponent }) => {
    return (
        <View style={styles.weaknessContainer}>
            <View style={styles.headerContainer}>
                <View style={styles.titleContainer}>
                    <Text style={styles.titleText}>{title}</Text>
                </View>
                {IconComponent && (
                    <View style={styles.iconWrapper}>
                        <IconComponent
                            style={styles.icon}
                            stroke="#212121"
                        />
                    </View>
                )}
            </View>
            <View style={styles.descriptionContainer}>
                <Text style={styles.descriptionText}>{description}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    weaknessContainer: {
        backgroundColor: customColors.beige2,
        borderRadius: 16,
        display: "flex",
        width: "100%",
        padding: 16,
        flexDirection: "column",
        overflow: "hidden",
        alignItems: "stretch",
        marginTop: 8,
    },
    headerContainer: {
        display: "flex",
        width: "100%",
        alignItems: "center",
        gap: 40,
        justifyContent: "space-between",
        flexDirection: "row",
    },
    titleContainer: {
        alignSelf: "stretch",
        marginTop: "auto",
        marginBottom: "auto",
    },
    titleText: {
        fontSize: 20,
        fontWeight: "600",
        letterSpacing: -0.4,
        lineHeight: 26,
    },
    iconWrapper: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    icon: {
        alignSelf: "stretch",
        width: 18,
        aspectRatio: 1,
    },
    descriptionContainer: {
        marginTop: 8,
    },
    descriptionText: {
        fontSize: 16,
        fontWeight: "400",
        lineHeight: 24,
        letterSpacing: -0.24,
    },
});