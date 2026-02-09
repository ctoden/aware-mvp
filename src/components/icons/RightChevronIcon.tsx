import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";
import { ColorValue, Platform } from "react-native";

type RightChevronIconProps = SvgProps & { strokecolor?: ColorValue };

const RightChevronIcon: React.FC<RightChevronIconProps> = (props) => {
    const webProps = Platform.OS === 'web' ? { xmlns: "http://www.w3.org/2000/svg" } : {};
    const strokeColor = props.strokecolor || '#212121';
    return (
        <Svg
            width={7}
            height={10}
            viewBox="0 0 7 10"
            fill="none"
            {...webProps}
            {...props}
        >
            <Path
                d="M1 1L5 5L1 9"
                stroke={strokeColor as ColorValue}
                strokeWidth={2}
                strokeLinecap="round"
            />
        </Svg>
    );
};

const Memo = React.memo(RightChevronIcon);
export default Memo; 