import { observer, useObservable } from "@legendapp/state/react";
import { convertCoreValuesToArray, getUserCoreValuesArray, userCoreValues$ } from "@src/models/UserCoreValue";
import { StyleSheet, Text, View } from "react-native";
import { CoreValueCard } from "./CoreValueCard";
import React, { useMemo } from "react";

export const CoreValuesList: React.FC = observer(() => {
    const coreValues = useMemo(() => {
        const coreValues = convertCoreValuesToArray(userCoreValues$.peek());
        return coreValues;
    }, [userCoreValues$.get()]);

    return (
        <View style={styles.container}>
            <View style={styles.headerWrapper}>
                <Text style={styles.heading}>Core values</Text>
            </View>
            <View style={styles.valuesContainer}>
                {coreValues.map((value) => (
                    <CoreValueCard 
                        key={value.id} 
                        value={{
                            title: value.title,
                            description: value.description,
                            iconUrl: "https://cdn.builder.io/api/v1/image/assets/49f9222b7d4543e099417d52e6a4eba4/3708cdaf4d2175101aa7a391e19dd733a06dede3773b3e581a04dda4656471e5?apiKey=49f9222b7d4543e099417d52e6a4eba4&"
                        }} 
                    />
                ))}
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
    valuesContainer: {
        display: "flex",
        width: "100%",
        flexDirection: "column",
        alignItems: "stretch",
        color: "#212120",
        gap: 8,
    },
});