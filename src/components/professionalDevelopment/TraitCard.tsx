import React from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import { Text, View } from 'react-native-ui-lib';
import { ProfessionalDevelopmentTraitProps } from './types';
import RightChevronIcon from '@src/components/icons/RightChevronIcon';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

interface TraitCardProps {
    trait: ProfessionalDevelopmentTraitProps;
}

export const TraitCard: React.FC<TraitCardProps> = ({ trait }) => {
    // Generate a unique ID for this gradient to avoid conflicts with other SVG gradients
    const gradientId = `trait-card-gradient-${trait.title.replace(/\s+/g, '-').toLowerCase()}`;

    return (
        <View style={styles.card}>
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
                            <Stop offset="0%" stopColor="#97B5F5" stopOpacity="1" />
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
            <View style={styles.contentContainer}>
                <View style={styles.header}>
                    <Text style={styles.title}>{trait.title}</Text>
                    <Text style={styles.subtitle}>{trait.subtitle}</Text>
                </View>
                <RightChevronIcon strokecolor="#212121" style={styles.traitCardIcon} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 24,
        padding: 16,
        marginBottom: 16,
        overflow: 'hidden',
        position: 'relative',
        minHeight: 80,
        width: '100%',
    },
    backgroundContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: -1,
        borderRadius: 24, // Match parent borderRadius
    },
    contentContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        zIndex: 1,
    },
    header: {
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        marginBottom: 8,
        flex: 1,
    },
    subtitle: {
        fontSize: 16,
        fontWeight: '400',
        letterSpacing: -0.3,
        marginTop: 4,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
    },
    traitCardIcon: {
        alignSelf: 'center',
        marginLeft: 8,
    },
}); 