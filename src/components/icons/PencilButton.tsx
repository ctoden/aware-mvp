import * as React from "react";
import Svg, { SvgProps, G, Path, Defs, ClipPath, Rect } from "react-native-svg";
import { Platform } from "react-native";

const PencilIcon: React.FC<SvgProps> = (props) => {
    const webProps = Platform.OS === 'web' ? { xmlns: "http://www.w3.org/2000/svg" } : {};
    return (
        <Svg
            fill="none"
            width={24}
            height={24}
            {...webProps}
            {...props}
        >
            <G clipPath="url(#clip0_1953_1478)">
                <Path d="M15.0248 3.05377V2.62435C15.0155 2.5955 15.0069 2.56378 15 2.52967L14.9999 2.52901C14.853 1.79099 14.4606 1.34692 13.7809 1.13844L15.0248 3.05377ZM15.0248 3.05377C14.9242 3.57722 14.6017 4.00114 14.086 4.47561M15.0248 3.05377L14.086 4.47561M14.086 4.47561C13.9554 4.59558 13.8253 4.72295 13.7002 4.84885C12.8768 4.02542 12.0564 3.20496 11.2283 2.37667C11.4827 2.121 11.7346 1.86828 11.9902 1.61736L14.086 4.47561ZM15.1172 2.82347C15.1181 2.82491 15.118 2.82478 15.1172 2.82341L15.1172 2.82347ZM11.9904 1.61719C12.5322 1.08612 13.107 0.932032 13.7807 1.13839L11.9904 1.61719Z" stroke="#F0EBE4" stroke-width="1.5" />
                <Path d="M9.03714 4.57348C8.92647 4.68411 8.8158 4.79473 8.70514 4.90535C6.38322 7.22629 4.06178 9.54676 1.74518 11.8717C1.7449 11.8724 1.74463 11.8731 1.74436 11.8739C1.74323 11.8771 1.74273 11.8792 1.74265 11.8795L9.03714 4.57348ZM9.03714 4.57348C9.86454 5.40113 10.687 6.22362 11.5116 7.04822" stroke="#F0EBE4" stroke-width="1.5" />
            </G>
            <Defs>
                <ClipPath id="clip0_1953_1478">
                    <Rect width="24" height="24" fill="white" />
                </ClipPath>
            </Defs>
        </Svg>
    );
}

const Memo = React.memo(PencilIcon);
export default Memo;


