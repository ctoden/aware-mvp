import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";
import { Platform } from "react-native";

const BackArrow: React.FC<SvgProps> = (props) => {
    const webProps = Platform.OS === 'web' ? { xmlns: "http://www.w3.org/2000/svg" } : {};
    return (
        <Svg
            fill="none"
            width={25}
            height={24}
            {...webProps}
            {...props}
        >
            <Path
                d="M10.782 17.557 5.5 12.282 10.782 7M19.759 12.282H5.5"
                stroke="#212120"
                strokeWidth={2}
                strokeMiterlimit={10}
                strokeLinecap="round"
            />
        </Svg>
    );
}

const Memo = React.memo(BackArrow);
export default Memo;