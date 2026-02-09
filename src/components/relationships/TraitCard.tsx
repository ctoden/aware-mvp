import * as React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { TraitCardProps } from './types';
import RightChevronIcon from '@src/components/icons/RightChevronIcon';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

export const TraitCard: React.FC<TraitCardProps> = ({ title, subtitle }) => {
    // Generate a unique ID for this gradient to avoid conflicts with other SVG gradients
    const gradientId = `relationship-trait-gradient-${title.replace(/\s+/g, '-').toLowerCase()}`;

    return (
        <View style={styles.traitCardContainer}>
            <View style={styles.backgroundContainer}>
                <Svg
                    width="100%"
                    height="100%"
                    preserveAspectRatio="none"
                >
                    <Defs>
                        <LinearGradient
                            id={gradientId}
                            x1="50%"
                            y1="100%"
                            x2="50%"
                            y2="0%"
                        >
                            <Stop offset="0%" stopColor="#FECF51" stopOpacity="1" />
                            <Stop offset="50%" stopColor="#D4C7B6" stopOpacity="1" />
                            <Stop offset="100%" stopColor="#E1DCCE" stopOpacity="1" />
                        </LinearGradient>
                    </Defs>
                    <Rect
                        x="0"
                        y="0"
                        width="100%"
                        height="100%"
                        fill={`url(#${gradientId})`}
                    />
                </Svg>
            </View>
            
            {/* Content container with higher zIndex to ensure it's above the background */}
            <View style={styles.contentWrapper}>
                <View style={styles.traitCardContent}>
                    <Text style={styles.traitCardTitle}>{title}</Text>
                    <Text style={styles.traitCardSubtitle}>{subtitle}</Text>
                </View>
                <RightChevronIcon strokecolor="#212121" style={styles.traitCardIcon} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    traitCardContainer: {
        borderRadius: 24,
        width: '100%',
        paddingHorizontal: 16,
        paddingVertical: 16,
        marginTop: 8,
        position: 'relative',
        overflow: 'hidden',
    },
    backgroundContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: -1,
        borderRadius: 24,
    },
    contentWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        zIndex: 1,
    },
    traitCardContent: {
        alignSelf: 'stretch',
        display: 'flex',
        minWidth: 240,
        marginVertical: 'auto',
        flexDirection: 'column',
        alignItems: 'stretch',
        flex: 1,
        flexShrink: 1,
        flexBasis: '0%',
    },
    traitCardTitle: {
        fontSize: 20,
        fontWeight: '600',
        lineHeight: 24,
        letterSpacing: -0.2,
        textAlign: 'left',
    },
    traitCardSubtitle: {
        fontSize: 16,
        fontWeight: '400',
        letterSpacing: -0.3,
        marginTop: 4,
    },
    traitCardIcon: {
        alignSelf: 'center',
        marginLeft: 8,
    },
});