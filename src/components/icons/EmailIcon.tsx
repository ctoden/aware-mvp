import * as React from "react";
import Svg, { Path, Rect, SvgProps } from "react-native-svg";
import { Platform } from "react-native";

const EmailIcon: React.FC<SvgProps> = (props) => {
    const webProps = Platform.OS === 'web' ? { xmlns: "http://www.w3.org/2000/svg" } : {};
    return (
        <Svg
            width={17}
            height={13}
            fill="none"
            viewBox="0 0 17 13"
            {...webProps}
            {...props}
        >
            <Rect
                x={0.5}
                y={1}
                width={16}
                height={11}
                rx={1.5}
                stroke="#F0EBE4"
            />
            <Path
                d="M1 1.5L7.04092 7.94365C7.83107 8.78648 9.16893 8.78648 9.95907 7.94365L16 1.5"
                stroke="#F0EBE4"
                strokeLinecap="round"
            />
            <Path
                d="M13 7.5L15.5 11"
                stroke="#F0EBE4"
                strokeLinecap="round"
            />
            <Path
                d="M1 11.5L4 7.5"
                stroke="#F0EBE4"
                strokeLinecap="round"
            />
        </Svg>
    );
};

const Memo = React.memo(EmailIcon);
export default Memo; 