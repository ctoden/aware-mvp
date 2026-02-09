import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";
import { Platform } from "react-native";

const WhiteRightArrow: React.FC<SvgProps> = (props) => {
    const webProps = Platform.OS === 'web' ? { xmlns: "http://www.w3.org/2000/svg" } : {};
    return (
        <Svg
            width={15}
            height={9}
            fill="none"
            viewBox="0 0 15 9"
            {...webProps}
            {...props}
        >
            <Path
                d="M14 4.5C13.4815 3.98148 11.4506 1.95062 10.5 1"
                stroke="#F0EBE4"
            />
            <Path
                d="M10.5 8C11.0185 7.48148 13.0494 5.45062 14 4.5"
                stroke="#F0EBE4"
            />
            <Path
                d="M13.9985 4.5L0.58188 4.5"
                stroke="#F0EBE4"
            />
        </Svg>
    );
};

const Memo = React.memo(WhiteRightArrow);
export default Memo; 