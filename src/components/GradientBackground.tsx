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
}

export const GradientBackground: React.FC<GradientBackgroundProps> = ({
    gradientId,
    colors,
    color = customColors.beige2, // default color
    style,
    borderRadius = 0
}) => {
    // Generate unique ID if not provided
    const uniqueId = React.useMemo(() => 
        gradientId || `gradient-${generateUUID()}`, 
        [gradientId]
    );

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

    return (
        <View style={[styles.container, style]}>
            <Svg
                width="100%"
                height="100%"
                preserveAspectRatio="none"
            >
                <Defs>
                    <LinearGradient
                        id={uniqueId}
                        x1="50%"
                        y1="100%"
                        x2="50%"
                        y2="0%"
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
                    width="100%"
                    height="100%"
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
