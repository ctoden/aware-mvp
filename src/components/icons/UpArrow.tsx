import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";
import { Platform } from "react-native";

const SvgComponent: React.FC<SvgProps> = (props) => {
    const webProps = Platform.OS === 'web' ? { xmlns: "http://www.w3.org/2000/svg" } : {};
    return (
        <Svg
            fill="none"
            {...webProps}
            {...props}
        >
            <Path
                d="M8.707.593a1 1 0 00-1.414 0L.929 6.957A1 1 0 002.343 8.37L8 2.714l5.657 5.657a1 1 0 101.414-1.414L8.707.593zM9 18.7V1.3H7v17.4h2z"
                fill="#212120"
            />
        </Svg>
    )
}

export default SvgComponent
