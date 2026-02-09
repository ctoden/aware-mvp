import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";
import { Platform } from "react-native";

const SvgComponent: React.FC<SvgProps> = (props) => {
  const webProps = Platform.OS === 'web' ? { xmlns: "http://www.w3.org/2000/svg" } : {};
  return (
    <Svg
      width={18}
      height={19}
      fill="none"
      {...webProps}
      {...props}
    >
      <Path
        d="M3.535 12.392a2.893 2.893 0 100-5.786 2.893 2.893 0 000 5.786zM14.463 17.857a2.893 2.893 0 100-5.786 2.893 2.893 0 000 5.786zM14.463 6.928a2.893 2.893 0 100-5.785 2.893 2.893 0 000 5.785zM6.12 8.214l5.76-2.893M6.12 10.785l5.76 2.893"
        stroke="#212120"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default SvgComponent;
