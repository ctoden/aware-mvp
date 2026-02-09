import React, { FC } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { View, Text } from 'react-native-ui-lib';
import { AboutYouSectionType } from '@src/models/UserAboutYou';
import { customColors } from '@app/constants/theme';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import ShareButton from '@src/components/icons/ShareButton';
import { AboutYouViewModel } from '@src/viewModels/AboutYouViewModel';

interface InsightHeaderCardProps {
    sectionType: AboutYouSectionType;
    title: string;
    onShare?: () => void;
}

const getSectionColor = (sectionType: AboutYouSectionType): string => {
    const config = AboutYouViewModel.getSectionConfig(sectionType);
    return config.color;
};

const getSectionLabel = (sectionType: AboutYouSectionType): string => {
    const config = AboutYouViewModel.getSectionConfig(sectionType);
    return config.title;
};

export const InsightHeaderCard: FC<InsightHeaderCardProps> = ({ sectionType, title, onShare }) => {
    const sectionColor = getSectionColor(sectionType);
    const sectionLabel = getSectionLabel(sectionType);
    const { Icon } = AboutYouViewModel.getSectionConfig(sectionType);
    
    // Generate a unique ID for the gradient
    const gradientId = `insight-header-gradient-${title.replace(/\s+/g, '-').toLowerCase()}`;
    
    const handleShare = () => {
        if (onShare) {
            onShare();
        } else {
            console.log('Share button pressed');
        }
    };

    return (
        <View style={styles.insightCard} marginB-s6>
            {/* Gradient Background */}
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
                            <Stop offset="0%" stopColor={sectionColor} stopOpacity="1" />
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
                        rx="20"
                        ry="20"
                    />
                </Svg>
            </View>
            
            {/* Card Content */}
            <View style={styles.cardContent}>
                <View style={styles.insightCardHeader}>
                    {/* Category Chip */}
                    <View style={[styles.categoryChip, { backgroundColor: sectionColor }]}>
                        <Icon width={16} height={16} fill={customColors.black1} />
                        <Text style={styles.categoryText}>{sectionLabel}</Text>
                    </View>
                    
                    {/* Share Button */}
                    <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                        <View style={styles.shareButtonContent}>
                            <ShareButton />
                            <Text style={styles.shareButtonText}>Share</Text>
                        </View>
                    </TouchableOpacity>
                </View>
                
                {/* Title Container */}
                <View style={styles.titleContainer}>
                    <Text style={styles.insightTitle}>{title}</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    insightCard: {
        minHeight: 248,
        borderRadius: 20,
        padding: 24,
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
    },
    cardContent: {
        zIndex: 1,
        flex: 1,
        height: '100%',
        justifyContent: 'space-between',
    },
    insightCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderRadius: 40,
        paddingHorizontal: 16,
        paddingVertical: 8,
        alignSelf: 'flex-start',
    },
    categoryText: {
        fontSize: 16,
        fontWeight: '600',
        color: customColors.black1,
    },
    shareButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 40,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    shareButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    shareButtonText: {
        marginLeft: 8,
        fontSize: 16,
        fontWeight: '600',
        color: customColors.black1,
    },
    titleContainer: {
        paddingBottom: 16,
    },
    insightTitle: {
        fontSize: 36,
        fontWeight: '700',
        color: customColors.black1,
    },
}); 