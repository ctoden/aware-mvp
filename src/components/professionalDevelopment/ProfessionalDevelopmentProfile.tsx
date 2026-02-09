import { useObservable } from '@legendapp/state/react';
import { professionalDevelopment$ } from '@src/models/ProfessionalDevelopment';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Text, View, Colors } from 'react-native-ui-lib';
import { TraitCard } from './TraitCard';
import { TraitChip } from './TraitChip';
import { useRouter } from 'expo-router';
import { setSelectedProfileInsight } from '@src/models/ProfileInsightModel';
import { customColors } from '@app/constants/theme';

export const ProfessionalDevelopmentProfile: React.FC = () => {
    const profDev = useObservable(professionalDevelopment$);
    const router = useRouter();

    if (!profDev) {
        return null;
    }

    const keyTerms = profDev.key_terms?.get() || [];
    const description = profDev.description?.get() || '';
    const leadershipTitle = profDev.leadership_style_title?.get() || '';
    const leadershipDescription = profDev.leadership_style_description?.get() || '';
    const goalSettingTitle = profDev.goal_setting_style_title?.get() || '';
    const goalSettingDescription = profDev.goal_setting_style_description?.get() || '';

    const navigateToInsightDetail = (title: string, category: string) => {
        // Set the selected profile insight with data from the card
        setSelectedProfileInsight({
            title: title,
            category: category,
            backgroundColor: customColors.blue, // Using the blue color for professional development
            content: {
                overview: 'People who have an assertive communication style express their thoughts, feelings, and needs directly and confidently, while showing respect for the perspectives and boundaries of others. Unlike passive communicators, they do not avoid conflict or fail to voice their needs. They differ from passive-aggressive communicators by addressing concerns openly instead of relying on indirect or sarcastic methods. Unlike aggressive communicators, they prioritize collaboration and fairness over overpowering others or imposing their will.',
                whatItMeansForMe: 'Since you tend to have an assertive communication style, your ability to articulate big ideas with confidence and clarity makes you a natural leader. However, your competitive and commanding nature might occasionally come across as overly intense, especially when you\'re laser-focused on winning or achieving a goal. Take a breath and ensure you\'re balancing your drive with a touch of humility and curiosity. Asking others for their perspectives not only enriches your strategies but also shows that you value their input—which can transform followers into loyal collaborators.'
            }
        });
        
        router.push('/(tabs)/UserProfileInsightDetail');
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Professional Development</Text>
                <View style={styles.chipContainer}>
                    {keyTerms.map((term, index) => (
                        <TraitChip key={index} text={term} />
                    ))}
                </View>
            </View>

            <Text style={styles.description}>{description}</Text>

            <View style={styles.traitsContainer}>
                <TouchableOpacity 
                    onPress={() => navigateToInsightDetail(leadershipTitle, "Leadership style")}
                >
                    <TraitCard
                        trait={{
                            title: leadershipTitle,
                            subtitle: "Leadership style",
                            description: leadershipDescription,
                        }}
                    />
                </TouchableOpacity>

                <TouchableOpacity 
                    onPress={() => navigateToInsightDetail(goalSettingTitle, "Goal-setting style")}
                >
                    <TraitCard
                        trait={{
                            title: goalSettingTitle,
                            subtitle: "Goal-setting style",
                            description: goalSettingDescription,
                        }}
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        color: Colors.$textPrimary,
    },
    header: {
        marginBottom: 0,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 16,
    },
    description: {
        fontSize: 16,
        marginBottom: 24,
        lineHeight: 24,
    },
    traitsContainer: {},
}); 