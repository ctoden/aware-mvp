import * as React from "react";
import { View, Image, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useCallback } from "react";

export const Header: React.FC = () => {
    const router = useRouter();
    const handleClose = useCallback(() => {
        router.navigate("/");
    }, [router]);

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={handleClose}>
                <Image
                    resizeMode="contain"
                    source={{ uri: "https://cdn.builder.io/api/v1/image/assets/49f9222b7d4543e099417d52e6a4eba4/805f2d48cba55531c927cc9d03f704f49c3a9b2fa0140bf084db4f9250b3d09d?apiKey=49f9222b7d4543e099417d52e6a4eba4&" }}
                    style={styles.leftImage}
                    accessibilityLabel="Left header icon"
                />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        display: "flex",
        width: "100%",
        paddingTop: 5,
        paddingBottom: 20,
        alignItems: "center",
        justifyContent: "flex-start",
    },
    leftImage: {
        alignSelf: "stretch",
        width: 23,
        aspectRatio: 2.3,
    },
    rightIconContainer: {
        borderRadius: 50,
        alignSelf: "stretch",
        display: "flex",
        marginTop: "auto",
        marginBottom: "auto",
        minHeight: 32,
        paddingLeft: 7,
        paddingRight: 7,
        alignItems: "center",
        gap: 10,
        overflow: "hidden",
        justifyContent: "center",
        width: 32,
        height: 32,
        backgroundColor: "rgba(225, 220, 206, 1)",
    },
    rightImage: {
        alignSelf: "center",
        width: 12,
        aspectRatio: 1,
    },
});