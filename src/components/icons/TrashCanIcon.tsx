import * as React from "react";
import Svg, { Path, SvgProps, G, Defs, ClipPath, Rect } from "react-native-svg";
import { Platform } from "react-native";

const TrashCanIcon: React.FC<SvgProps> = (props) => {
    const webProps = Platform.OS === 'web' ? { xmlns: "http://www.w3.org/2000/svg" } : {};
    return (
        <Svg
            width={16}
            height={16}
            fill="none"
            viewBox="0 0 16 16"
            {...webProps}
            {...props}
        >
            <G clipPath="url(#clip0_1590_2785)">
                <Path
                    d="M0.666656 3.33333H15.3333"
                    stroke="#C22900"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <Path
                    d="M9.5 0.666666H6.5C6.23478 0.666666 5.98043 0.772023 5.79289 0.959559C5.60536 1.1471 5.5 1.40145 5.5 1.66667V3.33333H10.5V1.66667C10.5 1.40145 10.3946 1.1471 10.2071 0.959559C10.0196 0.772023 9.76522 0.666666 9.5 0.666666Z"
                    stroke="#C22900"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <Path
                    d="M6.5 11.8333V6.83333"
                    stroke="#C22900"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <Path
                    d="M9.5 11.8333V6.83333"
                    stroke="#C22900"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <Path
                    d="M12.5733 14.4133C12.5548 14.6639 12.442 14.8981 12.2577 15.0688C12.0734 15.2395 11.8312 15.334 11.58 15.3333H4.42C4.16878 15.334 3.92663 15.2395 3.74231 15.0688C3.558 14.8981 3.44521 14.6639 3.42667 14.4133L2.5 3.33333H13.5L12.5733 14.4133Z"
                    stroke="#C22900"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </G>
            <Defs>
                <ClipPath id="clip0_1590_2785">
                    <Rect width={16} height={16} fill="white" />
                </ClipPath>
            </Defs>
        </Svg>
    );
};

const Memo = React.memo(TrashCanIcon);
export default Memo; 