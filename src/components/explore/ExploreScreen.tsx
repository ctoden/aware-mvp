import themeObject from '@app/constants/theme';
import { observer } from '@legendapp/state/react';
import { UserInsightView } from '@src/components/userInsights/UserInsightView';
import { useViewModel } from '@src/hooks/useViewModel';
import { ExploreScreenViewModel } from '@src/viewModels/ExploreScreenViewModel';
import React, { FC } from 'react';
import { ScrollView } from 'react-native';
import { Text, View } from 'react-native-ui-lib';
import {DigDeeperQuestionsView} from "@src/components/digDeeperQuestions/DigDeeperQuestionsView";
import { AboutYouList } from '../aboutYou/AboutYouList';
import { ExploreConversationStarterView } from '../exploreConversationStarter/ExploreConversationStarterView';

export const ExploreScreen: FC = observer(() => {
    const { viewModel, isInitialized, error } = useViewModel(ExploreScreenViewModel);

    if (!isInitialized) {
        return <Text>Loading...</Text>;
    }

    if (error) {
        return <Text>Error: {error.message}</Text>;
    }

    return (
        <View flex style={{ backgroundColor: themeObject.colors.background }}>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
                <View>
                    <UserInsightView />
                </View>
                <View marginT-50>
                    <DigDeeperQuestionsView />
                </View>
                <View marginT-50>
                    <AboutYouList />
                </View>
                <View marginT-50>
                    <ExploreConversationStarterView />
                </View>
            </ScrollView>
        </View>
    );
});

export default ExploreScreen; 