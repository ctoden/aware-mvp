import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";
import { Platform } from "react-native";

const CareerBriefCaseIcon: React.FC<SvgProps> = (props) => {
    const webProps = Platform.OS === 'web' ? { xmlns: "http://www.w3.org/2000/svg" } : {};
    return (
        <Svg
            width={8}
            height={8}
            viewBox="0 0 8 8"
            fill="none"
            {...webProps}
            {...props}
        >
            <Path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M7.5 2H6V0.5C6 0.223625 5.77637 0 5.5 0H2.5C2.22362 0 2 0.223625 2 0.5V2H0.5C0.223625 2 0 2.22362 0 2.5V7.5C0 7.77637 0.223625 8 0.5 8H7.5C7.77637 8 8 7.77637 8 7.5V2.5C8 2.22362 7.77637 2 7.5 2ZM3 1H5V2H3V1Z"
                fill="#212120"
            />
        </Svg>
    );
};

const Memo = React.memo(CareerBriefCaseIcon);
export default Memo; 