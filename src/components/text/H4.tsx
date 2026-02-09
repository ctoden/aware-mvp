import { customColors } from "@app/constants/theme";
import * as React from "react";
import { Text } from "react-native-ui-lib";
import { TextUIProps, styles } from "./types";


export const H4: React.FC<TextUIProps> = ({ children, color }) => {
    return (
        <Text style={[styles.H4, { color: color ? color : customColors.black1 }]}>
            {children}
        </Text>
    );
}