import * as React from 'react';
import { useMemo } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { DigDeeperQuestionCard } from './DigDeeperQuestionCard';
import { observer } from "@legendapp/state/react";
import { useViewModel } from "@src/hooks/useViewModel";
import { DigDeeperViewModel } from "@src/viewModels/DigDeeperViewModel";
import { DigDeeperQuestionStatus } from "@src/models/DigDeeperQuestion";

export const DigDeeperQuestionsView: React.FC = observer(() => {
    const { width: windowWidth } = useWindowDimensions();
    const marginLeft = useMemo(() => (windowWidth / 2) - (windowWidth / 2), [windowWidth]);
    const { viewModel, isInitialized } = useViewModel(DigDeeperViewModel);


    const digDeeperQuestions = viewModel.questions$.get();
    const mockDigDeeperQuestions = [{
        question: 'What are your career goals?',
        status: DigDeeperQuestionStatus.PENDING
    }, {
        question: 'What is one of your biggest fears when it comes to relationships?',
        status: DigDeeperQuestionStatus.PENDING
    }, {
        question: 'What is your job title? What industry or industries do you work in?',
        status: DigDeeperQuestionStatus.PENDING
    }]


    const topThreePendingQuestions = useMemo(() => {
        const questions = Object.values(digDeeperQuestions ?? {});
        return questions.length === 0
            ? mockDigDeeperQuestions
            : questions.filter((value) => value.status === DigDeeperQuestionStatus.PENDING).slice(0, 3);
    }, [digDeeperQuestions, mockDigDeeperQuestions]);

    return (
        <View style={styles.container}>
            <Text style={styles.heading}>Dig deeper </Text>
            <Text style={styles.description}>
                Answer these questions to gain deeper insight about your personality
            </Text>
            <View style={styles.cardsContainer}>
                {topThreePendingQuestions.map((value, index) => (
                    <DigDeeperQuestionCard
                        key={index}
                        title={value.question}
                    />
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
        gap: 8
    },
});
