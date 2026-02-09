import * as React from 'react';
import { Path, Svg } from 'react-native-svg';

interface ChevronDownIconProps {
    color?: string;
    style?: object;
}

export const ChevronDownIcon: React.FC<ChevronDownIconProps> = ({ color = '#1A202C', style }) => (
    <Svg width="20" height="20" viewBox="0 0 20 20" style={style}>
        <Path
            d="M5 7.5L10 12.5L15 7.5"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
        />
    </Svg>
); 