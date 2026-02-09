import React from "react";
import { ActivityIndicator } from "react-native";
import { View, Text } from "react-native-ui-lib";
import { useViewModel } from "@src/hooks/useViewModel";
import { ExploreConversationStarterViewModel } from "@src/viewModels/ExploreConversationStarterViewModel";
import { ExploreConversationStarterSection } from "./ExploreConversationStarterSection";
import { observer } from "@legendapp/state/react";
import { AboutYouSectionType } from "@src/models/UserAboutYou";
import { customColors } from "@app/constants/theme";
import { H2 } from "../text/H2";

export const ExploreConversationStarterView: React.FC = observer(() => {
    const { viewModel } = useViewModel(ExploreConversationStarterViewModel);
    const selfAwarenessQuestions = viewModel.getSelfAwarenessQuestions$.get();
    const relationshipsQuestions = viewModel.getRelationshipsQuestions$.get();
    const careerDevelopmentQuestions = viewModel.getCareerDevelopmentQuestions$.get();

    const isLoading = !selfAwarenessQuestions?.length || 
                     !relationshipsQuestions?.length || 
                     !careerDevelopmentQuestions?.length;

    return (
        <View flex>
            <View marginB-16>
                <H2>Start a conversation</H2>
            </View>
            <View flex>
                {isLoading ? (
                    <View center>
                        <ActivityIndicator size="large" color={customColors.black1} />
                    </View>
                ) : (
                    <>
                        <ExploreConversationStarterSection 
                            sectionType={AboutYouSectionType.SELF_AWARENESS}
                            questions={selfAwarenessQuestions} 
                        />
                        <ExploreConversationStarterSection 
                            sectionType={AboutYouSectionType.RELATIONSHIPS}
                            questions={relationshipsQuestions} 
                        />
                        <ExploreConversationStarterSection 
                            sectionType={AboutYouSectionType.CAREER_DEVELOPMENT}
                            questions={careerDevelopmentQuestions} 
                        />
                    </>
                )}
            </View>
        </View>
    );
});

ExploreConversationStarterView.displayName = 'ExploreConversationStarterView'; 