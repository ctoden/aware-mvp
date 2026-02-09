import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";
import { Platform } from "react-native";

// This file follows the project's Prettier formatting standards
interface PeopleIconProps extends SvgProps {
  filled?: boolean;
}

const PeopleIcon: React.FC<PeopleIconProps> = ({ filled = false, ...props }) => {
  const webProps = Platform.OS === 'web' ? { xmlns: "http://www.w3.org/2000/svg" } : {};

  return (
    <Svg
      width={24}
      height={26}
      viewBox="0 0 24 26"
      fill="none"
      {...webProps}
      {...props}
    >
      {filled ? (
        // Filled version
        <Path
          d="M7.14307 8.45898H14.8569C18.1311 8.45898 20.7856 11.1134 20.7856 14.3877V15.9795C20.7856 16.6163 20.2692 17.1328 19.6323 17.1328H18.3569L17.6001 23.1875C17.5776 23.3661 17.4253 23.4999 17.2456 23.5H13.3267C13.1693 23.4999 13.0333 23.3972 12.9868 23.252L12.9722 23.1875L12.271 17.5703L12.2153 17.1328H9.78467L9.02783 23.1875C9.00534 23.366 8.85322 23.4999 8.67334 23.5H4.75439C4.59698 23.4998 4.46103 23.3972 4.41455 23.252L4.40088 23.1875L3.64404 17.1328H2.36768C1.73087 17.1328 1.21436 16.6163 1.21436 15.9795V14.3877C1.21436 11.1134 3.86885 8.45901 7.14307 8.45898ZM6.71436 0.5C8.33176 0.5 9.64307 1.8113 9.64307 3.42871C9.64299 5.04605 8.33172 6.35742 6.71436 6.35742C5.097 6.35742 3.78572 5.04605 3.78564 3.42871C3.78564 1.8113 5.09695 0.5 6.71436 0.5ZM15.2856 0.5C16.9031 0.5 18.2144 1.8113 18.2144 3.42871C18.2143 5.04606 16.9031 6.35742 15.2856 6.35742C13.6683 6.35735 12.357 5.04601 12.3569 3.42871C12.3569 1.81135 13.6683 0.500075 15.2856 0.5Z"
          fill="#212120"
          stroke="#212120"
        />
      ) : (
        // Outline version
        <>
          <Path
            d="M10.1539 18.0769L9.23081 25H5.5385L4.61542 18.0769H1.84619V13C1.84619 9.9412 4.32585 7.46154 7.38465 7.46154H16.6154C19.6743 7.46154 22.1539 9.9412 22.1539 13V18.0769H19.3847L18.4616 25H14.7693L13.8462 18.0769"
            stroke="#545452"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M7.38458 7.46154C9.16889 7.46154 10.6153 6.01508 10.6153 4.23077C10.6153 2.44646 9.16889 1 7.38458 1C5.60027 1 4.15381 2.44646 4.15381 4.23077C4.15381 6.01508 5.60027 7.46154 7.38458 7.46154Z"
            stroke="#545452"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M16.6155 7.46154C18.3998 7.46154 19.8463 6.01508 19.8463 4.23077C19.8463 2.44646 18.3998 1 16.6155 1C14.8312 1 13.3848 2.44646 13.3848 4.23077C13.3848 6.01508 14.8312 7.46154 16.6155 7.46154Z"
            stroke="#545452"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
    </Svg>
  );
};

const Memo = React.memo(PeopleIcon);
export default Memo;
