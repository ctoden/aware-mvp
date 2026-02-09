import { customColors } from "@app/constants/theme";
import * as React from "react";
import { Text } from "react-native-ui-lib";
import { TextUIProps, styles } from "./types";


export const BodyRegular: React.FC<TextUIProps> = ({ children, color, noMargins, noPadding, center }) => {
    return (
        <Text style={[
            styles.BodyRegular,
            noMargins && { marginVertical: 0 },
            noPadding && { paddingVertical: 0 },
            center && { justifyContent: 'center' },
            center && { alignItems: 'center' },
            { color: color ? color : customColors.black1 }]}>
            {children}
        </Text>
    );
}