import React, { FC, useCallback } from 'react';
import { View, Card, TouchableOpacity } from 'react-native-ui-lib';
import { StyleSheet, Text, Platform } from 'react-native';
import { ReactiveText } from '@src/components/ReactiveText';
import { UserQuickInsight } from '@src/models/UserQuickInsightModel';
import themeObject, { customColors } from '@app/constants/theme';
import { useObservable } from '@legendapp/state/react';
import { AboutYouSectionType, setSelectedAboutYou } from '@src/models/UserAboutYou';
import { generateUUID } from '@src/utils/UUIDUtil';
import { user$ } from '@src/models/SessionModel';
import { useRouter } from 'expo-router';
import { ScreenRoutes } from '@src/models/NavigationModel';
import { H1 } from '../text/H1';
import { BodyTiny } from '../text/BodyTiny';
import { AIIcon } from '../icons/AIIcon';
import RadialQualityGradientView, { GradientStop } from '../topQualities/RadialQualityGradientView';

const { typography } = themeObject;

// Default gradient stops to ensure visibility
const defaultGradientStops: GradientStop[] = [
    { offset: '0%', color: '#7B68EE', opacity: 0.8 },
    { offset: '50%', color: '#9370DB', opacity: 0.6 },
    { offset: '100%', color: '#BA55D3', opacity: 0.4 }
];

interface InsightCardProps {
    insight: UserQuickInsight;
}

export const InsightCard: FC<InsightCardProps> = ({ insight }) => {
    const router = useRouter();
    const title$ = useObservable(insight.title);
    const description$ = useObservable(insight.description);
    // Generate a unique ID for this instance
    const uniqueGradientId = `insight-gradient-${generateUUID()}`;

    // Generate a deterministic ID based on insight content
    const generateDeterministicId = (title: string, description: string): string => {
        // Use the insight's content as a consistent seed for the ID
        // This ensures the same insight always gets the same ID
        return `insight-${title.slice(0, 20).trim().replace(/\s+/g, '-').toLowerCase()}-${description.slice(0, 30).trim().replace(/\s+/g, '-').toLowerCase()}`;
    };

    const handlePress = useCallback(() => {
        const userId = user$.peek()?.id;
        if (!userId) return;

        const title = title$.get() ?? '';
        const description = description$.get() ?? '';
        
        // Generate a deterministic ID based on content instead of random UUID
        const deterministicId = generateDeterministicId(title, description);

        setSelectedAboutYou({
            id: deterministicId,
            user_id: userId,
            title: title,
            description: description,
            section_type: AboutYouSectionType.SELF_AWARENESS,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });

        router.push(ScreenRoutes.InsightDetails);
    }, [title$, description$, router]);

    return (
        <TouchableOpacity onPress={handlePress}>
            <Card style={styles.cardContainer} >
                <View style={styles.gradientContainer}>
                    <RadialQualityGradientView
                        size={230}
                        showLegend={false}
                        gradientStops={defaultGradientStops}
                        uniqueId={uniqueGradientId}
                    />
                </View>
                <View style={styles.topLabel}>
                    <AIIcon />
                    <BodyTiny>For you</BodyTiny>
                </View>
                <View style={styles.titleContainer}>
                    <H1>{title$.get()}</H1>
                </View>
                <ReactiveText text$={description$} style={typography.bodyM} />
            </Card>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    topLabel: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 8
    },
    titleContainer: {
        marginTop: 60,
        maxWidth: '100%',
    },
    cardContainer: {
        position: 'relative',
        width: '100%',
        backgroundColor: customColors.beige2,
        borderRadius: 16,
        marginBottom: 32,
        padding: 32,
        overflow: 'hidden',
    },
    gradientContainer: {
        position: 'absolute',
        transform: Platform.OS === 'ios'
            ? 'translateX(100%) translateY(-100%)'
            : 'translateX(43%) translateY(-43%)',
        top: 0,
        right: 0,
    }
});

export default InsightCard;
