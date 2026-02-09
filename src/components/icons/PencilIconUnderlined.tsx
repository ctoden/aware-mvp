import * as React from 'react';
import { Platform } from 'react-native';
import { Path, Svg, SvgProps } from 'react-native-svg';
/***<svg width="18" height="19" viewBox="0 0 18 19" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M1 18H16.9923" stroke="#212120" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M7.66228 13.6167L3.66406 14.3333L4.33042 10.2985L13.2997 1.3926C13.4236 1.2682 13.5711 1.16945 13.7335 1.10208C13.8959 1.03469 14.07 1 14.246 1C14.4219 1 14.5961 1.03469 14.7585 1.10208C14.9209 1.16945 15.0684 1.2682 15.1923 1.3926L16.6049 2.79949C16.7299 2.92288 16.8291 3.06967 16.8967 3.23141C16.9643 3.39315 16.9992 3.56663 16.9992 3.74184C16.9992 3.91705 16.9643 4.09053 16.8967 4.25227C16.8291 4.41401 16.7299 4.5608 16.6049 4.68419L7.66228 13.6167Z" stroke="#212120" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
 */

interface PencilIconUnderlinedProps extends SvgProps {
    color?: string;
    style?: object;
}

const PencilIconUnderlined: React.FC<PencilIconUnderlinedProps> = ({ color = '#F0EBE4', style, ...props }) => {
    const webProps = Platform.OS === 'web' ? { xmlns: "http://www.w3.org/2000/svg" } : {};

    return (
        <Svg
            width={18}
            height={18}
            viewBox="0 0 18 18"
            fill='none'
            style={style}
            {...webProps}
            {...props}
        >
            <Path
                d="M1 18H16.9923"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round" />
            <Path
                d="M7.66228 13.6167L3.66406 14.3333L4.33042 10.2985L13.2997 1.3926C13.4236 1.2682 13.5711 1.16945 13.7335 1.10208C13.8959 1.03469 14.07 1 14.246 1C14.4219 1 14.5961 1.03469 14.7585 1.10208C14.9209 1.16945 15.0684 1.2682 15.1923 1.3926L16.6049 2.79949C16.7299 2.92288 16.8291 3.06967 16.8967 3.23141C16.9643 3.39315 16.9992 3.56663 16.9992 3.74184C16.9992 3.91705 16.9643 4.09053 16.8967 4.25227C16.8291 4.41401 16.7299 4.5608 16.6049 4.68419L7.66228 13.6167Z"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round" />
        </Svg>
    );
};

export default React.memo(PencilIconUnderlined);
