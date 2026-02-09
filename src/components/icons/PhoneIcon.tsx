import * as React from "react";
import Svg, { Path, ClipPath, Defs, G, Rect, SvgProps } from "react-native-svg";
import { Platform } from "react-native";

const PhoneIcon: React.FC<SvgProps> = (props) => {
    const webProps = Platform.OS === 'web' ? { xmlns: "http://www.w3.org/2000/svg" } : {};
    return (
        <Svg
            width={18}
            height={19}
            fill="none"
            viewBox="0 0 18 19"
            {...webProps}
            {...props}
        >
            <G clipPath="url(#clip0_1571_12360)">
                <Path
                    d="M13.5001 1.14282H4.50007C3.79 1.14282 3.21436 1.71846 3.21436 2.42854V16.5714C3.21436 17.2815 3.79 17.8571 4.50007 17.8571H13.5001C14.2102 17.8571 14.7858 17.2815 14.7858 16.5714V2.42854C14.7858 1.71846 14.2102 1.14282 13.5001 1.14282Z"
                    stroke="#F0EBE4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <Path
                    d="M8.35742 14.6428H9.64314"
                    stroke="#F0EBE4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </G>
            <Defs>
                <ClipPath id="clip0_1571_12360">
                    <Rect width={18} height={18} fill="white" y={0.5} />
                </ClipPath>
            </Defs>
        </Svg>
    );
};

const Memo = React.memo(PhoneIcon);
export default Memo; 