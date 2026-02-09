import * as React from 'react';
import { View, Text, StyleSheet, useWindowDimensions, TouchableOpacity } from 'react-native';
import { TraitChip } from './TraitChip';
import { TraitCard } from './TraitCard';
import { useCallback, useMemo } from 'react';
import { observer, useObservable } from "@legendapp/state/react";
import { userRelationships$ } from '@src/models/UserRelationship';
import { useRouter } from 'expo-router';
import { ScreenRoutes } from '@src/models/NavigationModel';
import { setSelectedProfileInsight } from '@src/models/ProfileInsightModel';
import { customColors } from '@app/constants/theme';

export const RelationshipProfile: React.FC = observer(() => {
    const { width: windowWidth } = useWindowDimensions();
    const marginLeft = useMemo(() => (windowWidth / 2) - (windowWidth / 2), [windowWidth]);
    const relationships = useObservable(userRelationships$);
    const router = useRouter();

    // Get the first relationship if it exists
    const relationship = relationships && Object.values(relationships)[0];

    // Map relationship data to UI components if it exists
    const traits = relationship?.key_terms.get() ?? [];
    const traitCards = relationship ? [
        { 
            title: relationship.communication_style_title.get() ?? '', 
            subtitle: 'Communication style' 
        },
        { 
            title: relationship.conflict_style_title.get() ?? '', 
            subtitle: 'Conflict style' 
        },
        { 
            title: relationship.attachment_style_title.get() ?? '', 
            subtitle: 'Attachment style' 
        },
    ] : [];

    const navigateToInsightDetail = useCallback((title: string, category: string) => {
        // Set the selected profile insight with data from the card
        setSelectedProfileInsight({
            title: title,
            category: category,
            backgroundColor: customColors.yellow, // Using the yellow color as requested
            content: {
                overview: 'People who have an assertive communication style express their thoughts, feelings, and needs directly and confidently, while showing respect for the perspectives and boundaries of others. Unlike passive communicators, they do not avoid conflict or fail to voice their needs. They differ from passive-aggressive communicators by addressing concerns openly instead of relying on indirect or sarcastic methods. Unlike aggressive communicators, they prioritize collaboration and fairness over overpowering others or imposing their will.',
                whatItMeansForMe: 'Since you tend to have an assertive communication style, your ability to articulate big ideas with confidence and clarity makes you a natural leader. However, your competitive and commanding nature might occasionally come across as overly intense, especially when you\'re laser-focused on winning or achieving a goal. Take a breath and ensure you\'re balancing your drive with a touch of humility and curiosity. Asking others for their perspectives not only enriches your strategies but also shows that you value their input—which can transform followers into loyal collaborators.'
            }
        });
        
        router.push('/(tabs)/UserProfileInsightDetail');
    }, [router]);

    return (
        <View style={styles.container}>
            <Text style={styles.heading}>Relationships</Text>

            <View style={[styles.traitsContainer, { marginLeft }]}>
                {traits.map((trait, index) => (
                    <TraitChip key={index} label={trait} />
                ))}
            </View>

            {relationship && (
                <Text style={styles.description}>
                    {relationship.description.get() ?? ''}
                </Text>
            )}

            <View style={styles.cardsContainer}>
                {traitCards.map((card, index) => (
                    <TouchableOpacity 
                        key={index} 
                        onPress={() => navigateToInsightDetail(card.title, card.subtitle)}
                    >
                        <TraitCard
                            title={card.title}
                            subtitle={card.subtitle}
                        />
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        fontFamily: 'Work Sans, sans-serif',
        color: 'rgba(33, 33, 32, 1)',
    },
    heading: {
        fontSize: 24,
        fontWeight: '600',
        lineHeight: 24,
        letterSpacing: -0.46,
    },
    traitsContainer: {
        display: 'flex',
        marginTop: 16,
        gap: 4,
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'right',
        letterSpacing: -0.16,
        lineHeight: 16,
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    description: {
        fontFamily: 'Work Sans, sans-serif',
        fontSize: 16,
        fontWeight: '400',
        lineHeight: 24,
        letterSpacing: -0.3,
        marginTop: 16,
        width: '100%',
    },
    cardsContainer: {
        display: 'flex',
        marginTop: 16,
        width: '100%',
        flexDirection: 'column',
        alignItems: 'stretch',
    },
});