import * as React from "react";
import { StyleSheet, ViewStyle } from "react-native";
import { View } from "react-native-ui-lib";
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { customColors } from "@app/constants/theme";
import { generateUUID } from "@src/utils/UUIDUtil";

interface GradientBackgroundProps {
    gradientId?: string;
    colors?: string[];
    color?: string; // kept for backward compatibility
    style?: ViewStyle;
    borderRadius?: number;
    angle?: number; // angle in degrees, 0 = bottom to top, 90 = left to right
}

export const GradientBackground: React.FC<GradientBackgroundProps> = ({
    gradientId,
    colors,
    color = customColors.beige2, // default color
    style,
    borderRadius = 0,
    angle = 0 // default angle (bottom to top)
}) => {
    // Generate unique ID if not provided
    const uniqueId = React.useMemo(() => gradientId || `gradient-${generateUUID()}`, [gradientId]);

    // Calculate x1, y1, x2, y2 based on angle
    const getGradientCoordinates = (angleDeg: number) => {
        // Convert angle to radians
        const angleRad = (angleDeg - 90) * Math.PI / 180;
        
        // Calculate center point
        const cx = 50;
        const cy = 50;
        
        // Calculate start and end points
        const x1 = cx + Math.cos(angleRad) * 50;
        const y1 = cy + Math.sin(angleRad) * 50;
        const x2 = cx - Math.cos(angleRad) * 50;
        const y2 = cy - Math.sin(angleRad) * 50;
        
        return {
            x1: `${x1}%`,
            y1: `${y1}%`,
            x2: `${x2}%`,
            y2: `${y2}%`,
        };
    };

    // Handle gradient stops based on input
    const gradientStops = React.useMemo(() => {
        if (colors && colors.length > 0) {
            return colors.map((color, index) => ({
                offset: `${(index / (colors.length - 1)) * 100}%`,
                color,
                opacity: 1
            }));
        }

        // Default gradient if only single color provided
        return [
            { offset: "0%", color, opacity: 1 },
            { offset: "2%", color, opacity: 0.5 },
            { offset: "100%", color, opacity: 0 }
        ];
    }, [colors, color]);

    const { width = '100%', height = '100%' } = style || {};
    const coordinates = getGradientCoordinates(angle);

    return (
        <View style={[styles.container, style]}>
            <Svg
                width={typeof width === 'number' ? width : '100%'}
                height={typeof height === 'number' ? height : '100%'}
                preserveAspectRatio="none"
            >
                <Defs>
                    <LinearGradient
                        id={uniqueId}
                        {...coordinates}
                    >
                        {gradientStops.map((stop, index) => (
                            <Stop
                                key={index}
                                offset={stop.offset}
                                stopColor={stop.color}
                                stopOpacity={stop.opacity}
                            />
                        ))}
                    </LinearGradient>
                </Defs>
                <Rect
                    x="0"
                    y="0"
                    width={typeof width === 'number' ? width : '100%'}
                    height={typeof height === 'number' ? height : '100%'}
                    fill={`url(#${uniqueId})`}
                    rx={borderRadius}
                    ry={borderRadius}
                />
            </Svg>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: customColors.beige2,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: -1,
    },
});
