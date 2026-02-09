import React, { useCallback } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { Text, Toast, View } from "react-native-ui-lib";
import { AboutYouSectionType } from "@src/models/UserAboutYou";
import HeartIcon from "../icons/HeartIcon";
import PeopleGroupIcon from "../icons/PeopleGroupIcon";
import CareerBriefCaseIcon from "../icons/CareerBriefCaseIcon";
import { DependencyService } from "@src/core/injection/DependencyService";
import { ChatService } from "@src/services/ChatService";
import { useRouter } from "expo-router";
import { ScreenRoutes } from "@src/models/NavigationModel";
import { observable } from "@legendapp/state";
import { observer } from "@legendapp/state/react";
import { autoUserMsgToSend$, currentChatId$, findMainChat } from "@src/models/Chat";
import AboutYouTraitChip from "../aboutYou/AboutYouTraitChip";
import { customColors } from "@app/constants/theme";
import { H4 } from "../text/H4";
import { Ionicons } from "@expo/vector-icons";

interface ExploreConversationStarterSectionProps {
    sectionType: AboutYouSectionType;
    questions: string[];
}

const sectionState = observable({
    isLoading: false
});

const getSectionConfig = (type: AboutYouSectionType) => {
    switch (type) {
        case AboutYouSectionType.SELF_AWARENESS:
            return {
                title: "Self-awareness",
                color: "#4CAF50",
                Icon: HeartIcon
            };
        case AboutYouSectionType.RELATIONSHIPS:
            return {
                title: "Relationships",
                color: "#FECF51",
                Icon: PeopleGroupIcon
            };
        case AboutYouSectionType.CAREER_DEVELOPMENT:
            return {
                title: "Career Development",
                color: "#2196F3",
                Icon: CareerBriefCaseIcon
            };
    }
};

export const ExploreConversationStarterSection: React.FC<ExploreConversationStarterSectionProps> = observer(({
    sectionType,
    questions
}: ExploreConversationStarterSectionProps) => {
    const { title, color, Icon } = getSectionConfig(sectionType);
    const router = useRouter();
    const chatService = DependencyService.resolve(ChatService);

    const displayError = useCallback((title: string, msg: string) => {
        Toast.show({
            type: 'error',
            text1: title,
            text2: msg,
            position: 'bottom',
            visibilityTime: 2000,
        });
    }, [])

    const handleQuestionTap = async (question: string) => {
        if (sectionState.isLoading.get()) return;

        sectionState.isLoading.set(true);
        try {
            // Set the message to be sent and navigate
            const mainChat = findMainChat();
            if (!mainChat) {
                displayError("No Chat Found", "Could not find main chat thread");
                return;
            }
            currentChatId$.set(mainChat.id);
            autoUserMsgToSend$.set({ text: question });
            router.push(ScreenRoutes.Chat);
        } catch (error) {
            console.error('Error starting chat:', error);
            displayError("Error starting chat", error instanceof Error ? error.message : "Unknown error");
        } finally {
            sectionState.isLoading.set(false);
        }
    };

    return (
        <View style={styles.container}>
            <View row left>
                <AboutYouTraitChip
                    title={title}
                    color={color}
                    Icon={Icon}
                />
            </View>

            <View style={styles.questionsContainer}>
                {questions && questions.length > 0 && questions.map((question: string, index: number) => (
                    <TouchableOpacity
                        key={index}
                        onPress={() => handleQuestionTap(question)}
                        disabled={sectionState.isLoading.get()}
                    >
                        <View style={[
                            styles.questionItem,
                            sectionState.isLoading.get() && styles.questionItemDisabled
                        ]}>
                            <H4>{question}</H4>
                            <Ionicons
                                style={styles.questionArrow}
                                name="chevron-forward"
                                size={14}
                                color={customColors.black1} />
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    questionArrow: {
        marginHorizontal: 0,
    },
    container: {
        gap: 12,
    },
    traitChipContainer: {
        alignSelf: 'stretch',
        borderRadius: 40,
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 8,
    },
    traitChipText: {
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: -0.16,
    },
    questionsContainer: {
        gap: 8,
        marginBottom: 16
    },
    questionItem: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: customColors.beige2,
        paddingHorizontal: 30,
        paddingVertical: 18,
        borderRadius: 24,
    },
    questionItemDisabled: {
        opacity: 0.5,
    },
    questionText: {
        fontSize: 14,
        lineHeight: 20,
        color: '#212120',
    }
}); 