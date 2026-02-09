import { observer } from "@legendapp/state/react";
import * as React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { QualityCard } from "./QualityCard";
import { TopQualitiesViewModel } from "@src/viewModels/TopQualitiesViewModel";
import { useViewModel } from "@src/hooks/useViewModel";

const isHighLevel = (level: string): boolean => {
    // return level === "Highest" || level === "Very High";
    return level.toLowerCase().includes("high");
};

export const TopQualitiesList: React.FC = observer(() => {
    const { viewModel } = useViewModel(TopQualitiesViewModel);
    const qualities = viewModel.getVisibleQualities();
    const footerText = viewModel.getFooterText();

    const handleFooterPress = () => {
        viewModel.toggleExpanded();
    };

    return (
        <View style={styles.dashboardContainer}>
            <View style={styles.headerContainer}>
                <Text style={styles.headerText}>Top qualities</Text>
            </View>
            <View style={styles.qualitiesContainer}>
                {qualities.map((quality) => (
                    <QualityCard 
                        key={quality.id} 
                        quality={{
                            title: quality.title ?? '',
                            level: quality.level ?? '',
                            description: quality.description ?? '',
                            color: quality.color ?? '',
                            isHighLevel: isHighLevel(quality.level ?? '')
                        }} 
                    />
                ))}
            </View>
            <Pressable onPress={handleFooterPress} style={styles.footerContainer}>
                <Text style={styles.footerText}>{footerText}</Text>
            </Pressable>
        </View>
    );
});

const styles = StyleSheet.create({
    dashboardContainer: {
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        fontFamily: "Work Sans, sans-serif",
        width: '100%',
    },
    headerContainer: {
        marginBottom: 16,
    },
    headerText: {
        color: "#212120",
        fontSize: 24,
        fontWeight: "600",
        lineHeight: 24,
        letterSpacing: -0.48,
    },
    qualitiesContainer: {
        display: "flex",
        width: "100%",
        flexDirection: "column",
        alignItems: "stretch",
    },
    footerContainer: {
        marginTop: 16,
    },
    footerText: {
        alignSelf: "stretch",
        color: "#212120",
        textAlign: "center",
        fontSize: 16,
        fontWeight: "400",
        letterSpacing: -0.24,
        textDecorationLine: "underline",
    },
});