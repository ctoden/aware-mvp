import { customColors } from "@app/constants/theme";
import * as React from "react";
import { StyleSheet } from "react-native";
import { View, Text } from "react-native-ui-lib";

export const MainInterestsHeader: React.FC<{ isMyData: boolean }> = ({ isMyData }) => {
    return (
        <View style={styles.headerContainer}>
            <View style={styles.headerTop}>
                {
                    isMyData && (
                        <View style={styles.stepIndicator}>
                            <Text>1/9</Text>
                        </View>
                    )
                }
                <View style={styles.titleContainer}>
                    <Text h2>What do you want to focus on?</Text>
                </View>
            </View>
            <View style={styles.subtitleContainer}>
                <Text style={styles.subtitle}>
                    Your choices will customize the content you see on the Explore tab.
                </Text>
                <Text style={styles.subtitleEmoji}>✨</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    headerContainer: {
        display: "flex",
        maxWidth: "100%",
        width: "100%",
        flexDirection: "column",
        alignItems: "stretch",
        color: "#212120",
    },
    headerTop: {
        display: "flex",
        width: "100%",
        flexDirection: "column",
        alignItems: "stretch",
    },
    stepIndicator: {
        borderRadius: 16,
        paddingLeft: 8,
        paddingRight: 8,
        paddingTop: 4,
        paddingBottom: 4,
        fontSize: 12,
        fontWeight: "400",
        width: 40,
        backgroundColor: customColors.beige2,
    },
    titleContainer: {
        marginTop: 8,
    },
    subtitleContainer: {
        marginTop: 8,
        flexDirection: "column",
    },
    subtitle: {
        fontSize: 16,
        fontWeight: "400",
        lineHeight: 24,
        letterSpacing: -0.24,
    },
    subtitleEmoji: {
        marginTop: 8,
        fontSize: 36,
        fontWeight: "400",
        lineHeight: 36,
    },
});