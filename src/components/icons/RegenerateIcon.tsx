import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";
import { Platform } from "react-native";

const RegenerateIcon: React.FC<SvgProps> = (props) => {
    const webProps = Platform.OS === 'web' ? { xmlns: "http://www.w3.org/2000/svg" } : {};
    return (
        <Svg
            width={18}
            height={20}
            viewBox="0 0 18 20"
            fill="none"
            {...webProps}
            {...props}
        >
            <Path
                d="M9.687 18.943c-3.608.362-7-2.024-7.806-5.652-.87-3.915 1.598-7.795 5.514-8.665.673-.15 1.345-.201 2-.162"
                stroke="#F0EBE4"
                strokeWidth={2}
                strokeMiterlimit={10}
                strokeLinecap="round"
            />
            <Path
                d="M16.221 11.289c.032.543.004 1.09-.087 1.631M14.443 6.939c.27.308.513.639.728.992M14.767 16.091a8.041 8.041 0 0 1-1.282 1.315M8.023 1.703l2.894 2.979-2.98 2.894"
                stroke="#F0EBE4"
                strokeWidth={2}
                strokeMiterlimit={10}
                strokeLinecap="round"
            />
        </Svg>
    );
};

const Memo = React.memo(RegenerateIcon);
export default Memo; 