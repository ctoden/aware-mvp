import React, { FC, useCallback, useEffect, useState } from 'react';
import { ScrollView, ActivityIndicator } from 'react-native';
import { View, Text, Button } from 'react-native-ui-lib';
import { useViewModel } from '@src/hooks/useViewModel';
import { InsightDetailViewModel } from '@src/viewModels/InsightDetailViewModel';
import { InsightHeaderCard } from './InsightHeaderCard';
import { InsightContent } from './InsightContent';
import { ReactiveButton } from '@src/components/ReactiveButton';
import { observer, useObservable } from '@legendapp/state/react';
import { customColors } from '@app/constants/theme';
import { selectedAboutYou$ } from '@src/models/UserAboutYou';

export const InsightDetailsScreen: FC = observer(() => {
    const { viewModel, isInitialized } = useViewModel(InsightDetailViewModel);
    const article = useObservable(viewModel.article$);
    const isLoading = useObservable(viewModel.isLoading$);
    const error = useObservable(viewModel.error$);
    const selectedAboutYou = useObservable(selectedAboutYou$);
    const [fromCache, setFromCache] = useState(false);

    const handleGenerateInsight = useCallback(async () => {
        // Clear previous data before generating new insight
        viewModel.clear();
        setFromCache(false);
        
        // Check if this insight is cached
        const currentSelection = selectedAboutYou.get();
        if (currentSelection && viewModel.hasCachedInsight(currentSelection.id)) {
            setFromCache(true);
        }
        
        await viewModel.generateInsight();
    }, [viewModel, selectedAboutYou]);
    
    const handleRefreshInsight = useCallback(async () => {
        setFromCache(false);
        await viewModel.refreshInsight();
    }, [viewModel]);

    useEffect(() => {
        // This will now run whenever selectedAboutYou$ changes
        if (selectedAboutYou.get()) {
            handleGenerateInsight();
        }
    }, [selectedAboutYou.get(), handleGenerateInsight]);

    if (!isInitialized) {
        return null;
    }

    return (
        <View flex bg-backgroundLight>
            <ScrollView contentInsetAdjustmentBehavior="automatic">
                <View flex padding-page>
                    {error.get() && (
                        <View marginB-s4>
                            <ReactiveButton 
                                label="Try Again"
                                onPress={handleGenerateInsight}
                                backgroundColor={customColors.red}
                            />
                        </View>
                    )}
                    
                    {isLoading.get() ? (
                        <View center padding-s10>
                            <ActivityIndicator size="large" color={customColors.black1} />
                        </View>
                    ) : article.get() && (
                        <>
                            <InsightHeaderCard 
                                sectionType={article.get()!.metadata.sectionType}
                                title={article.get()!.metadata.title}
                            />
                            {fromCache && (
                                <View marginT-s2 marginB-s2 row centerV spread>
                                    <Text text90 color={customColors.gray2}>
                                        Loaded from cache
                                    </Text>
                                    <Button 
                                        label="Refresh" 
                                        size="small" 
                                        backgroundColor={customColors.beige3}
                                        onPress={handleRefreshInsight}
                                        disabled={isLoading.get()}
                                    />
                                </View>
                            )}
                            <InsightContent 
                                introduction={article.get()!.content.introduction.text}
                                sections={article.get()!.content.sections}
                            />
                        </>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}); 