import { observer, useObservable } from "@legendapp/state/react";
import { getUserWeaknessesArray, UserWeakness, userWeaknesses$ } from "@src/models/UserWeakness";
import * as React from "react";
import { StyleSheet, View } from "react-native";
import { SimpleList } from "../simpleList/SimpleList";
import { SimpleListCardProps } from "../simpleList/types";
import { useEffect } from "react";
import AiMagicIcon from "@src/components/icons/AiMagicIcon";

const mapWeaknesses = (weaknesses: UserWeakness[]): SimpleListCardProps[] => {
    return weaknesses.map((weakness) => ({
        title: weakness.title,
        description: weakness.description,
        IconComponent: AiMagicIcon
    }));
};

export const WeaknessesList: React.FC = observer(() => {
    const [weaknessItems, setWeaknessItems] = React.useState<SimpleListCardProps[]>(mapWeaknesses(getUserWeaknessesArray()));

    useEffect(() => {
        setWeaknessItems(mapWeaknesses(getUserWeaknessesArray()));
    }, [userWeaknesses$.get()]);       

    return (
        <View style={styles.container}>
            <View style={styles.listContainer}>
                <SimpleList listTitle={"Weaknesses"} simpleListItems={weaknessItems} />
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        fontFamily: "Work Sans, sans-serif",
    },
    listContainer: {
        display: "flex",
        width: "100%",
        flexDirection: "column",
        alignItems: "stretch",
        color: "#212120",
        gap: 8,
    }
}); 