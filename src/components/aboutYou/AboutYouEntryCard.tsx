import * as React from "react";
import { StyleSheet } from "react-native";
import { View, TouchableOpacity } from "react-native-ui-lib";
import { UserAboutYou, setSelectedAboutYou } from "@src/models/UserAboutYou";
import { customColors } from "@app/constants/theme";
import { useRouter } from "expo-router";
import { ScreenRoutes } from "@src/models/NavigationModel";
import { H4 } from "../text/H4";
import { AIIconOutlines } from "../icons/AIIconOutlines";
import { GradientBackground } from "../common/GradientBackground";

interface AboutYouEntryProps {
    entry: UserAboutYou;
    color: string;
}

export const AboutYouEntryCard: React.FC<AboutYouEntryProps> = ({ entry, color }) => {
    const router = useRouter();
    const gradientId = `about-you-entry-gradient-${entry.title.replace(/\s+/g, '-').toLowerCase()}`;

    const handlePress = React.useCallback(() => {
        setSelectedAboutYou(entry);
        router.push(ScreenRoutes.InsightDetails);
    }, [entry, router]);

    return (
        <TouchableOpacity onPress={handlePress}>
            <View style={styles.entryContainer}>
                <GradientBackground
                    gradientId={gradientId}
                    color={color}
                    borderRadius={16}
                    angle={180}
                />

                <View style={styles.headerContainer}>
                    <View style={styles.H4Container}>
                        <H4>{entry.title}</H4>
                    </View>
                </View>
                <AIIconOutlines style={styles.AIIconOutlines} />
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    entryContainer: {
        borderRadius: 16,
        padding: 16,
        flexDirection: "column",
        overflow: "hidden",
        gap: 12,
        minWidth: 180,
        maxWidth: 180,
        minHeight: 140,
        maxHeight: 140,
        position: 'relative'
    },
    headerContainer: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "flex-start",
        width: "100%",
        zIndex: 1,
    },
    titleText: {
        fontSize: 16,
        fontWeight: "600",
        lineHeight: 20,
        letterSpacing: -0.36,
        color: "#212120",
    },
    AIIconOutlines: {
        position: 'absolute',
        left: 16,
        bottom: 16,
        width: 18,
        height: 18,
        zIndex: 1,
    },
    H4Container: {
        display: 'flex',
        alignSelf: 'flex-start',
        width: "100%",
        flexGrow: 1
    }
}); 
