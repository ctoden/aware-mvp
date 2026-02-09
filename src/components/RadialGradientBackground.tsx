import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { GradientBackgroundProps } from './GradientBackground';

export const RadialGradientBackground: React.FC<GradientBackgroundProps> = ({
    gradientId,
    config,
    style,
    borderRadius = 0,
    children
}) => {
    const {
        centerX = "50%",
        centerY = "50%",
        radiusX = "50%",
        radiusY = "50%",
        focalX = "50%",
        focalY = "50%",
        stops
    } = config;

    return (
        <View style={[styles.container, style]}>
            <View style={styles.gradientContainer}>
                <Svg
                    width="100%"
                    height="100%"
                    style={StyleSheet.absoluteFill}
                >
                    <Defs>
                        <RadialGradient
                            id={gradientId}
                            cx={centerX}
                            cy={centerY}
                            rx={radiusX}
                            ry={radiusY}
                            fx={focalX}
                            fy={focalY}
                            gradientUnits="userSpaceOnUse"
                        >
                            {stops.map((stop, index) => (
                                <Stop
                                    key={index}
                                    offset={stop.offset}
                                    stopColor={stop.color}
                                    stopOpacity={stop.opacity}
                                />
                            ))}
                        </RadialGradient>
                    </Defs>
                    <Rect
                        x="0"
                        y="0"
                        width="100%"
                        height="100%"
                        fill={`url(#${gradientId})`}
                        rx={borderRadius}
                        ry={borderRadius}
                    />
                </Svg>
            </View>
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        overflow: 'hidden',
    },
    gradientContainer: {
        position: 'absolute',
        width: '100%',
        height: '100%',
    }
});
