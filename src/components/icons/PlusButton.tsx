import * as React from "react";
import Svg, {Path, SvgProps} from "react-native-svg";
import {ColorValue, Platform} from "react-native";

type PlusButtonProps = SvgProps & { iconcolor?: ColorValue };

const PlusButton: React.FC<PlusButtonProps> = (props) => {
    const webProps = Platform.OS === 'web' ? { xmlns: "http://www.w3.org/2000/svg" } : {};
    const iconColor = props.iconcolor || '#212120';
    return (
        <Svg
            width={18}
            height={19}
            fill="none"
            {...webProps}
            {...props}
        >
            <Path
                d="M9 1.5v16M1 9.5h16"
                stroke={iconColor as ColorValue}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}

const Memo = React.memo(PlusButton);
export default Memo;