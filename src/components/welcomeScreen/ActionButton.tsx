import * as React from "react";
import {StyleSheet, Text, TouchableOpacity, View} from "react-native";
import type {ActionButtonProps} from "./types";
import PlusButton from "@src/components/icons/PlusButton";
import { ButtonRegular } from "../text/ButtonRegular";
import { customColors } from "@app/constants/theme";

export const ActionButton: React.FC<ActionButtonProps> = ({
    label,
    onPress
}) => {
    return (
        <TouchableOpacity onPress={onPress} style={styles.actionButton}>
            <PlusButton iconcolor={"#FFFFFF"} />
            <View style={styles.labelContainer}>
                <ButtonRegular color={customColors.white}>{label}</ButtonRegular>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    actionButton: {
        borderRadius: 50,
        display: "flex",
        width: "100%",
        maxWidth: 361,
        paddingHorizontal: 24,
        paddingVertical: 16,
        gap: 4,
        flexDirection: "row",
        justifyContent: "center",
        backgroundColor: "#212120",
        marginBottom: 40,
    },
    actionIcon: {
        alignSelf: "center",
        width: 24,
        aspectRatio: 1,
    },
    labelContainer: {
        alignSelf: "center",
    }
});