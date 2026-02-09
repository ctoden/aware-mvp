import React, { FC, useEffect, useMemo } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { Toast, View } from 'react-native-ui-lib';
import { ReactiveText } from '@src/components/ReactiveText';
import { useViewModel } from '@src/hooks/useViewModel';
import { UserQuickInsightViewModel } from '@src/viewModels/UserQuickInsightViewModel';
import { observer, useObservable } from '@legendapp/state/react';
import { Memo } from '@legendapp/state/react';
import themeObject, { customColors } from '@app/constants/theme';
import { InsightCard } from './InsightCard';
import RegenerateIcon from '@src/components/icons/RegenerateIcon';
import { custom } from 'zod';

const { typography, colors } = themeObject;

export const UserInsightView: FC = observer(() => {
    const { viewModel, isInitialized, error } = useViewModel(UserQuickInsightViewModel);
    const loadingText$ = useObservable('Loading insights...');
    const generatingText$ = useObservable(viewModel.generatingText$.get());
    const errorText$ = useObservable('Error loading insights');
    const titleText$ = useObservable('Insights for you');
    const emptyText$ = useObservable('No insights yet');

    // Memoize the Set of insights
    // const memoizedInsightsSet = useMemo(() => {
    //     const insights = viewModel.insights$.get();
    //     const uniqueInsights = [...new Map(insights.map(item => [item.id, item])).values()];
    //     return uniqueInsights;
    // }, [viewModel.insights$.get()]);

    useEffect(() => {
        const insights = viewModel.insights$.get();
        const isGenerating = viewModel.isGenerating$.get();
    }, [isInitialized, error, viewModel]);

    const handleGenerateInsight = async () => {
        const result = await viewModel.generateInsight();
        if (result.isErr()) {
            console.error('Failed to generate insight:', result.error);
        }
    };

    if (!isInitialized) {
        return (
            <View center>
                <ReactiveText text$={loadingText$} />
            </View>
        );
    }

    if (error) {
        return (
            <View center>
                <ReactiveText text$={errorText$} style={{ color: colors.error }} />
            </View>
        );
    }

    const handleDelete = async (id: string) => {
        const result = await viewModel.deleteInsight(id);
        if (result.isErr()) {
            console.error('Failed to delete insight:', result.error);
        }
    };

    return (
        <View flex style={{ height: '100%' }}>
            <View marginB-s6>
                <ReactiveText text$={titleText$} style={typography.h2} />
            </View>
            <Memo>
                {() => {
                    const insights = viewModel.insights$.get();
                    const isGenerating = viewModel.isGenerating$.get();
                    const uniqueInsights = [...new Map(insights.map(item => [item.id, item])).values()];

                    if (isGenerating) {
                        return (
                            <View center flex>
                                <ActivityIndicator size="large" color={colors.primary} />
                                <ReactiveText 
                                    text$={generatingText$} 
                                    style={[typography.bodyM, {marginTop: 16}]}
                                />
                            </View>
                        );
                    }

                    if (insights.length === 0) {
                        return (
                            <View center>
                                <ReactiveText 
                                    text$={emptyText$} 
                                    style={typography.bodyM}
                                />
                            </View>
                        );
                    }

                    return (
                        <View>
                            {[...uniqueInsights].map((insight) => (
                                <InsightCard 
                                    key={insight.id}
                                    insight={insight}
                                />
                            ))}
                        </View>
                    );
                }}
            </Memo>
            <View style={styles.bottomContainer}>
                <TouchableOpacity
                    style={styles.generateButton}
                    onPress={handleGenerateInsight}
                    disabled={viewModel.isGenerating$.get()}
                >
                    <View style={styles.buttonContent}>
                        <RegenerateIcon style={styles.icon} />
                        <ReactiveText 
                            text$={generatingText$} 
                            style={styles.generateButtonText} 
                        />
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
}); 

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: customColors.beige3,
        bottom: 0,
    },
    bottomContainer: {
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    generateButton: {
        backgroundColor: '#000',
        padding: 16,
        borderRadius: 24,
        width: '100%',
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    icon: {
        marginTop: 2, // Fine-tune vertical alignment if needed
    },
    generateButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '500',
    },
}); 