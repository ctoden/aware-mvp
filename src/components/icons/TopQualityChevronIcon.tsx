import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";
import { ColorValue, Platform } from "react-native";

type TopQualityChevronIconProps = SvgProps & { iconcolor?: ColorValue };

const TopQualityChevronIcon: React.FC<TopQualityChevronIconProps> = (props) => {
    const webProps = Platform.OS === 'web' ? { xmlns: "http://www.w3.org/2000/svg" } : {};
    const iconColor = props.iconcolor || '#255FA9';
    return (
        <Svg
            width={10}
            height={7}
            viewBox="0 0 10 7"
            fill="none"
            {...webProps}
            {...props}
        >
            <Path
                d="M1 6L5 2L9 6"
                stroke={iconColor as ColorValue}
                strokeWidth={2}
                strokeLinecap="round"
            />
        </Svg>
    );
};

const Memo = React.memo(TopQualityChevronIcon);
export default Memo; 