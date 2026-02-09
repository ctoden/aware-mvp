import { customColors } from "@app/constants/theme";
import * as React from "react";
import { Text } from "react-native-ui-lib";
import { TextUIProps, styles } from "./types";


export const H3: React.FC<TextUIProps> = ({ children, color }) => {
    return (
        <Text style={[styles.H3, { color: color ? color : customColors.black1 }]}>
            {children}
        </Text>
    );
}