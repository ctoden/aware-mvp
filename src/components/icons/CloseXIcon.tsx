import { customColors } from '@app/constants/theme';
import * as React from 'react';
import { Path, Svg } from 'react-native-svg';
interface ICloseXIconProps {
    color?: string;
    style?: object;
}
export const CloseXIcon: React.FC<ICloseXIconProps> = ({ color = customColors.black1, style }) => {
    return (
        <Svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <Path
                d="M1 1C2.48148 2.48148 8.28395 8.28395 11 11"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round" 
                />
            <Path
                d="M11 1C9.51852 2.48148 3.71605 8.28395 1 11"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
            />
        </Svg>
    )
}