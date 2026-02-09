import { customColors } from "@app/constants/theme";
import * as React from "react";
import { Text } from "react-native-ui-lib";
import { TextUIProps, styles } from "./types";


export const Title: React.FC<TextUIProps> = ({ children, color }) => {
    return (
        <Text style={[styles.Title, { color: color ? color : customColors.black1 }]}>
            {children}
        </Text>
    );
}