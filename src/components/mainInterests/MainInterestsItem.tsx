import * as React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { useViewModel } from "@src/hooks/useViewModel";
import { UserMainInterestViewModel } from "@src/viewModels/UserMainInterestViewModel";
import { observer } from "@legendapp/state/react";

interface MainInterestsItemProps {
    emoji: string;
    text: string;
}

export const MainInterestsItem: React.FC<MainInterestsItemProps> = observer(({ emoji, text }) => {
    const { viewModel } = useViewModel(UserMainInterestViewModel);
    const isSelected = viewModel.isInterestSelected$(text).get();

    const handlePress = async () => {
        if (isSelected) {
            const result = await viewModel.removeUserMainInterest(text);
            if (result.isErr()) {
                console.error('Failed to remove interest:', result.error);
            }
        } else {
            const result = await viewModel.addUserMainInterest(text);
            if (result.isErr()) {
                console.error('Failed to add interest:', result.error);
            }
        }
    };

    return (
        <TouchableOpacity
            onPress={handlePress}
            style={[styles.itemContainer, isSelected && styles.selectedItem]}
            accessible={true}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`${text} interest option`}>
            <Text style={styles.itemText}>
                {emoji} {text}
            </Text>
        </TouchableOpacity>
    );
});

const styles = StyleSheet.create({
    itemContainer: {
        alignSelf: "stretch",
        borderRadius: 16,
        marginTop: 16,
        minHeight: 64,
        width: "100%",
        paddingLeft: 16,
        paddingRight: 16,
        paddingTop: 22,
        paddingBottom: 22,
        backgroundColor: "#F5F5F5",
        overflow: "hidden",
    },
    selectedItem: {
        backgroundColor: "#E0E0E0",
    },
    itemText: {
        fontSize: 16,
        fontWeight: "600",
        letterSpacing: -0.16,
        lineHeight: 20,
    },
});