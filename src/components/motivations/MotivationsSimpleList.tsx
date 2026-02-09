import { observer, useObservable } from "@legendapp/state/react";
import { getUserMotivationsArray, UserMotivation, userMotivations$ } from "@src/models/UserMotivation";
import * as React from "react";
import { FC, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SimpleList } from "../simpleList/SimpleList";
import { SimpleListCardProps } from "../simpleList/types";
import AiMagicIcon from "@src/components/icons/AiMagicIcon";

const mapMotivations = (motivation: UserMotivation[]): SimpleListCardProps[] => {
    return motivation.map((motivation) => ({
        title: motivation.title,
        description: motivation.description,
        IconComponent: AiMagicIcon
    }));
};

export const MotivationsSimpleList: FC = observer(() => {
    const [motivationItems, setMotivationItems] = useState<SimpleListCardProps[]>(mapMotivations(getUserMotivationsArray(userMotivations$.get())));

    useEffect(() => {
        setMotivationItems(mapMotivations(getUserMotivationsArray()));
    }, [userMotivations$.get()]);

    return (
        <View style={styles.container}>
            <View style={styles.listContainer}>
                <SimpleList listTitle={"Motivations"} simpleListItems={motivationItems} />
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
    headerWrapper: {
        marginBottom: 16,
    },
    heading: {
        color: "#212120",
        fontSize: 24,
        fontWeight: "600",
        lineHeight: 24,
        letterSpacing: -0.48,
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

export default MotivationsSimpleList;