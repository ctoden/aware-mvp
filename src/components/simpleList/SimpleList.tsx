import * as React from "react";
import { View, StyleSheet, Text } from "react-native";
import { SimpleListCard } from "./SimpleListCard";
import { SimpleListProps } from "./types";

export const SimpleList: React.FC<SimpleListProps> = ({ listTitle, simpleListItems }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.heading}>{listTitle}</Text>
            <View style={styles.listContainer}>
                {simpleListItems.map((weakness, index) => (
                    <SimpleListCard
                        key={index}
                        title={weakness.title}
                        description={weakness.description}
                        IconComponent={weakness.IconComponent}
                    />
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        fontFamily: "Work Sans, sans-serif",
        color: "#212120",
    },
    heading: {
        fontSize: 24,
        fontWeight: "600",
        lineHeight: 24,
        letterSpacing: -0.48,
    },
    listContainer: {
        display: "flex",
        marginTop: 16,
        width: "100%",
        flexDirection: "column",
        alignItems: "stretch",
    },
});