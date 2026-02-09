import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import { IUserTopQuality } from '@src/models/UserTopQuality';
import { topQualityColors, customColors } from '@app/constants/theme';
import { GradientStop } from './topQualities/RadialQualityGradientView';
import { generateUUID } from '@src/utils/UUIDUtil';

export interface RadialQualityGradientProps {
  qualities: IUserTopQuality[];
  size?: number;
  style?: ViewStyle;
  testID?: string;
  gradientStops?: GradientStop[];
  uniqueId?: string; // Optional unique ID prop
}

// Map of quality titles to their color key in the topQualityColors object
const qualityToColorKey: Record<string, keyof typeof topQualityColors> = {
  'Extraversion': 'extraverted',
  'Emotional Stability': 'emotionalStability',
  'Agreeableness': 'agreeableness',
  'Spirituality': 'spirituality',
  'Openness': 'openness',
  'Rationality': 'rationality',
  'Conscientiousness': 'conscientiousness',
  'Honesty-Humility': 'honestyHumility',
};

// Default colors if we can't match a quality to a color
const DEFAULT_COLORS = [
  customColors.lavender,
  customColors.marigold,
  customColors.blue
];

// Figma gradient stops - specific values from the design
const GRADIENT_STOPS = {
  FIRST: "31%",
  SECOND: "52%",
  THIRD: "73%",
  FOURTH: "100%",
};

// Transparent edge color
const TRANSPARENT_EDGE_COLOR = "#F0EBE4"; // White/beige color that fades to transparent

export const RadialQualityGradient: React.FC<RadialQualityGradientProps> = ({
  qualities,
  size = 100,
  style,
  testID,
  gradientStops,
  uniqueId,
}) => {
  // Generate a unique ID for this gradient instance if not provided
  const gradientId = uniqueId || `grad-${generateUUID()}`;
  
  const stops = gradientStops || [
    { offset: GRADIENT_STOPS.FIRST, color: DEFAULT_COLORS[0], opacity: 1 },
    { offset: GRADIENT_STOPS.SECOND, color: DEFAULT_COLORS[1], opacity: 1 },
    { offset: GRADIENT_STOPS.THIRD, color: DEFAULT_COLORS[2], opacity: 1 },
    { offset: GRADIENT_STOPS.FOURTH, color: TRANSPARENT_EDGE_COLOR, opacity: 0 }
  ];

  // Sort qualities by score (highest first)
  const sortedQualities = [...qualities].sort((a, b) => b.score - a.score);
  
  // Get top 3 qualities
  const topThree = sortedQualities.slice(0, 3);
  
  // If we don't have enough qualities, use fallback colors
  if (topThree.length < 3) {
    return (
      <View style={[styles.container, { width: size, height: size }, style]} testID={testID}>
        <Svg width={size} height={size}>
          <Defs>
            <RadialGradient
              id={gradientId}
              cx="50%"
              cy="50%"
              rx="50%"
              ry="50%"
              fx="50%"
              fy="50%"
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
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2}
            fill={`url(#${gradientId})`}
          />
        </Svg>
      </View>
    );
  }

  // Get colors for top 3 qualities
  const getColorForQuality = (quality: IUserTopQuality, index: number): string => {
    // If quality already has a color, use it
    if (quality.color) return quality.color;
    
    // Otherwise try to match to a known color
    const colorKey = qualityToColorKey[quality.title];
    if (colorKey) return topQualityColors[colorKey];
    
    // If no match, use the default color for this position
    return DEFAULT_COLORS[index] || DEFAULT_COLORS[0];
  };

  // Get colors from top qualities
  const centerColor = getColorForQuality(topThree[0], 0);
  const middleColor = getColorForQuality(topThree[1], 1);
  const outerColor = getColorForQuality(topThree[2], 2);

  return (
    <View style={[styles.container, { width: size, height: size }, style]} testID={testID}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient
            id={gradientId}
            cx="50%"
            cy="50%"
            rx="50%"
            ry="50%"
            fx="50%"
            fy="50%"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset={GRADIENT_STOPS.FIRST} stopColor={centerColor} stopOpacity="1" />
            <Stop offset={GRADIENT_STOPS.SECOND} stopColor={middleColor} stopOpacity="1" />
            <Stop offset={GRADIENT_STOPS.THIRD} stopColor={outerColor} stopOpacity="1" />
            <Stop offset={GRADIENT_STOPS.FOURTH} stopColor={TRANSPARENT_EDGE_COLOR} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2}
          fill={`url(#${gradientId})`}
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 999, // Make it a perfect circle
    overflow: 'hidden',
  },
});

export default RadialQualityGradient; 
