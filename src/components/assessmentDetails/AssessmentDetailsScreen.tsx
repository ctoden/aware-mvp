import React, { FC } from 'react';
import { observer } from '@legendapp/state/react';
import { View, Text, Image } from 'react-native-ui-lib';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useViewModel } from '@src/hooks/useViewModel';
import { AssessmentDetailsViewModel } from './AssessmentDetailsViewModel';
import { customColors } from '@app/constants/theme';
import { NavigationViewModel } from '@src/viewModels/NavigationViewModel';
import { assessmentStyles } from '../text/types';
import BackArrow from '../icons/BackArrow';
import { AssessmentResultsCard } from './assessmentResultsCard/AssessmentResultsCard';
import { H2 } from '../text/H2';
import AssessmentDetailEntry from './assessmentDetailEntry/AssessmentDetailEntry';
import { BodyRegular } from '../text/BodyRegular';

export const AssessmentDetailsScreen: FC = observer(() => {
    const { viewModel, isInitialized } = useViewModel(AssessmentDetailsViewModel);
    const { viewModel: navigationViewModel } = useViewModel(NavigationViewModel);

    const isLoading = viewModel.isLoading$.get();
    const error = viewModel.error$.get();

    const mockAssessment = [{
        title: 'Extroversion (E)',
        copy: 'People who prefer Extraversion feel energized by interaction in the outer world of people and things. Their attention is naturally drawn in this outward direction.'
    }, {
        title: 'Intuition (N)',
        copy: 'People who prefer Intuition pay more attention to the patterns and possibilities in the information they receive. They focus on what could be, by looking at the big picture and making connections between the facts. They use their five senses, too, but rely on perception through insights and hunches (trust inspiration).'
    }, {
        title: 'Thinking (T)',
        copy: 'People who prefer Thinking put more weight on objective principles and impersonal facts when decision-making. They focus on logic and analysis.'
    }, {
        title: 'Perceiving (P)',
        copy: 'People who prefer Perceiving like a more flexible and open-ended lifestyle. Rather than control their environment, they want to experience it through exploring options. Interaction with the outside world is through their information gathering (perceiving) mental process of Sensing or Intuition. Staying open to new information, last minute options, and being adaptable is important to people with a Perceiving preference.'
    }];

    const handleBack = () => {
        navigationViewModel.navigateToIndex();
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 75 : 75}
        >
            <ScrollView
                contentContainerStyle={assessmentStyles.scrollView}
                keyboardShouldPersistTaps="handled">
                {/* Header */}
                <View>
                    <View style={styles.headerContainer}>
                        <TouchableOpacity onPress={handleBack}>
                            <BackArrow />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.innerContainer}>
                        <View>
                            <H2 noMargins noPadding>Myers Briggs (MBTI®)</H2>
                            <Image
                                source={require('@assets/images/mbti.png')}
                                style={styles.logo}
                                resizeMode="contain"
                            />
                            <BodyRegular noMargins noPadding>The Myers-Briggs Type Indicator (MBTI®) is a widely-used self-report questionnaire that helps individuals understand their unique preferences in perceiving the world and making decisions, assigning them one of 16 personality types. </BodyRegular>
                        </View>
                        <AssessmentResultsCard title='ENTP' />

                        <AssessmentDetailEntry title='Summary' copy='The ENTP (Extraverted, Intuitive, Thinking, Perceiving) personality type is known for being innovative, adaptable, and resourceful. These individuals excel at generating new ideas, exploring possibilities, and engaging in stimulating conversations. Their quick wit, enthusiasm, and love for intellectual challenges make them enjoyable to be around and valuable contributors to various projects and discussions.' />
                        {
                            mockAssessment.map((item, index) => (
                                <AssessmentDetailEntry key={index} title={item.title} copy={item.copy} />
                            ))
                        }


                        <View>
                            <Text>Your uploads:</Text>
                            <Text>filename</Text>
                            <Text>delete icon</Text>
                        </View>
                        <View>
                            <Text>Learn more about assessment</Text>
                            <Text>Re-take the assessment</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
});
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: customColors.beige1,
        width: '100%',
        maxWidth: '100%',
        marginBottom: 98
    },
    headerContainer: {
        zIndex: 10,
        display: 'flex',
        marginTop: 20,
        width: 60,
        height: 60,
        paddingVertical: 16,
    },
    innerContainer: {
        display: 'flex',
        width: '100%',
        flexDirection: 'column',
        alignItems: 'flex-start',
    },
    logo: {
        maxWidth: 84,
        height: undefined,
        aspectRatio: 1,
        marginTop: 18,
        marginBottom: 50
    }
})
