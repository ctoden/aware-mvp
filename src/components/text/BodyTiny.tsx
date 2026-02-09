import { customColors } from "@app/constants/theme";
import * as React from "react";
import { Text } from "react-native-ui-lib";
import { TextUIProps, styles } from "./types";


export const BodyTiny: React.FC<TextUIProps> = ({ children, color }) => {
    return (
        <Text style={[styles.BodyTiny, { color: color ? color : customColors.black1 }]}>
            {children}
        </Text>
    );
}