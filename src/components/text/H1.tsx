import { customColors } from "@app/constants/theme";
import * as React from "react";
import { Text } from "react-native-ui-lib";
import { TextUIProps, styles } from "./types";


export const H1: React.FC<TextUIProps> = ({ children, color, noMargins, noPadding, shadow }) => {
    return (
        <Text style={[
            styles.H1,
            shadow && {
                textShadowColor: 'rgba(0, 0, 0, .25)', // Shadow color
                textShadowOffset: { width: 0, height: 4 }, // Shadow position
                textShadowRadius: 4, // Shadow blur radius
            },
            noMargins && { marginVertical: 0 },
            noPadding && { paddingVertical: 0 },
            { color: color ? color : customColors.black1 }]}>
            {children}
        </Text>
    );
}