import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";
import { Platform } from "react-native";

const ChatListButton: React.FC<SvgProps> = (props) => {
    const webProps = Platform.OS === 'web' ? { xmlns: "http://www.w3.org/2000/svg" } : {};
    return (
        <Svg
            fill="none"
            width={19}
            height={22}
            {...webProps}
            {...props}
        >
            <Path
                d="M12.354 5.665H3.23c-.72 0-1.303.584-1.303 1.303v11.729c0 .72.584 1.303 1.303 1.303h9.123c.72 0 1.303-.583 1.303-1.303V6.968c0-.72-.584-1.303-1.303-1.303ZM5.104 9.412H10.4M5.104 12.588h3.177"
                stroke="#212120"
                strokeWidth={2.052}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <Path
                d="M7.548 2h8.47a1.303 1.303 0 0 1 1.304 1.303v12.38"
                stroke="#212120"
                strokeWidth={2.052}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}

const Memo = React.memo(ChatListButton);
export default Memo;