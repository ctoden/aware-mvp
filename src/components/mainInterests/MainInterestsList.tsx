import * as React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { MainInterestsItem } from "./MainInterestsItem";

const interestsData = [
    { id: 1, emoji: "📈", text: "Career growth" },
    { id: 2, emoji: "💪", text: "Health & fitness" },
    { id: 3, emoji: "🧠", text: "Mindfulness" },
    { id: 4, emoji: "❤️", text: "Emotional intelligence" },
    { id: 5, emoji: "😌", text: "Mental well-being" },
    { id: 6, emoji: "🥇", text: "Confidence building" },
    { id: 7, emoji: "📚", text: "Learning & development" },
    { id: 8, emoji: "👪", text: "Parenting support" },
    { id: 9, emoji: "✅", text: "Self-discipline" },
    { id: 10, emoji: "😁", text: "Happiness & fulfillment" },
];

export const MainInterestsList: React.FC = () => {
    return (
        <View style={styles.listContainer}>
            <Text style={styles.listHeader}>Select all that apply</Text>
            {interestsData.map((interest) => (
                <MainInterestsItem
                    key={interest.id}
                emoji={interest.emoji}
                    text={interest.text}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    listContainer: {
        display: "flex",
        marginTop: 48,
        width: "100%",
        flexDirection: "column",
        alignItems: "stretch",
        fontSize: 16,
        color: "#212120",
        fontWeight: "600",
        flex: 1,
    },
    listHeader: {
        color: "#545452",
        textAlign: "left",
        fontSize: 12,
        fontWeight: "400",
    },
});
