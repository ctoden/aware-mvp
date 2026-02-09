import { customColors } from "@app/constants/theme";
import { Ionicons } from '@expo/vector-icons';
import React from "react";
import { View, Image } from "react-native-ui-lib";
import { Platform } from 'react-native';

interface MyDataAvatarProps {
    style: any,
    src: string
}

export const Avatar: React.FC<MyDataAvatarProps> = ({ style, src }) => {
    // Calculate icon size based on provided style dimensions or platform
    const iconSize = Platform.OS === 'ios' ? 30 : 40;

    return (
        <View style={style}>
            {src ? (
                <Image
                    source={{ uri: src }}
                    style={style}
                    resizeMode="cover"
                />
            ) : (
                <Ionicons
                    name="person-circle-outline"
                    size={iconSize}
                    color={customColors.black1}
                />
            )}
        </View>
    )
}