import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";
import { Platform } from "react-native";

const HeartIcon: React.FC<SvgProps> = (props) => {
    const webProps = Platform.OS === 'web' ? { xmlns: "http://www.w3.org/2000/svg" } : {};
    return (
        <Svg
            width={10}
            height={8}
            viewBox="0 0 10 8"
            fill="none"
            {...webProps}
            {...props}
        >
            <Path
                d="M7.34912 0C9.4473 0 10.1421 2.42657 9.40928 3.7535C8.28457 5.81366 4.84693 8 4.84693 8C4.84693 8 1.39675 5.81366 0.284568 3.7535C-0.448661 2.42657 0.234014 0 2.34473 0C4.29124 0 4.78383 1.6808 4.84733 1.93357C4.91042 1.6808 5.40342 0 7.34993 0H7.34912Z"
                fill="#212120"
            />
        </Svg>
    );
};

const Memo = React.memo(HeartIcon);
export default Memo; 