import * as React from "react";
import { StyleSheet } from "react-native";
import { View, Text } from "react-native-ui-lib";
import { QualityCardProps } from "./types";
import { customColors } from "@app/constants/theme"
import TopQualityChevronIcon from "../icons/TopQualityChevronIcon";

const getLevelCount = (level: string): number => {
    switch (level.toLowerCase()) {
        case 'highest':
            return 4;
        case 'very high':
            return 3;
        case 'high':
            return 2;
        default:
            return 1;
    }
};

export const QualityCard: React.FC<QualityCardProps> = ({ quality }) => {
    const chevronCount = getLevelCount(quality.level);

    return (
        <View flex marginT-8 padding-16 width="100%" style={styles.qualityContainer}>
            <View flex row style={styles.headerContainer}>
                <View style={styles.titleWithCircleContainer}>
                    <View 
                        style={[
                            styles.colorCircle, 
                            { backgroundColor: quality.color }
                        ]} 
                    />
                    <Text style={styles.titleText}>{quality.title}</Text>
                </View>
                <View style={[styles.levelContainer]}>
                    <View style={styles.levelTextWrapper}>
                        <Text style={[styles.levelText, { color: quality.color }]}>{quality.level}</Text>
                    </View>
                    <View style={styles.chevronContainer}>
                        {[...Array(chevronCount)].map((_, index) => (
                            <TopQualityChevronIcon
                                key={index}
                                iconcolor={quality.color}
                                style={styles.levelIcon}
                            />
                        ))}
                    </View>
                </View>
            </View>
            <View style={styles.descriptionContainer}>
                <Text style={styles.descriptionText}>{quality.description}</Text>
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
    titleWithCircleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    colorCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
    },
    titleText: {
        fontSize: 20,
        fontWeight: "600",
        lineHeight: 26,
        letterSpacing: -0.4,
        color: "#212120",
    },
    levelContainer: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        fontSize: 16,
        fontWeight: "400",
        textAlign: "right",
        letterSpacing: -0.24,
    },
    levelTextWrapper: {
        alignSelf: "stretch",
        marginTop: "auto",
        marginBottom: "auto",
    },
    levelText: {
        fontSize: 16,
        fontWeight: "400",
    },
    levelIcon: {
        alignSelf: "stretch",
        position: "relative",
        display: "flex",
        marginTop: "auto",
        marginBottom: "auto",
        width: 8,
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
    chevronContainer: {
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
    },
});