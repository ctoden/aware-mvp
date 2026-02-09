import * as React from 'react';
import {useMemo} from 'react';
import {SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {ChatSection} from './ChatSection';
import {customColors} from "@app/constants/theme";
import BackArrow from "@src/components/icons/BackArrow";
import {router} from 'expo-router';
import PlusButton from '../icons/PlusButton';
import {chats$, currentChatId$} from '@src/models/Chat';
import {useObservable} from '@legendapp/state/react';
import {useViewModel} from '@src/hooks/useViewModel';
import {ChatListViewModel} from '@src/viewModels/ChatListViewModel';
import {NavigationViewModel} from '@src/viewModels/NavigationViewModel';

export const ChatListScreen: React.FC = () => {
    const chats = useObservable(chats$);
    const { viewModel } = useViewModel(ChatListViewModel);
    const { viewModel: navigationViewModel } = useViewModel(NavigationViewModel);

    const groupedChats = useMemo(() => {
        return viewModel.getGroupedChats();
    }, [chats]);

    const handleNewChat = async () => {
        const result = await viewModel.createNewChat();
        if (result.isOk() && result.value) {
            currentChatId$.set(result.value.id);
            router.navigate(`/${navigationViewModel.getCurrentLayout()}/Chat`);
        }
    };

    const handleBackPress = () => {
        router.back();
    };

    return (
        <SafeAreaView style={styles.screenContainer}>
            <View style={styles.mainContent}>
                <View style={styles.logoContainer}>
                    <TouchableOpacity onPress={handleBackPress}>
                        <BackArrow />
                    </TouchableOpacity>
                </View>
                <Text style={styles.headerText}>Threads</Text>
                <ScrollView style={styles.chatsContainer}>
                    {Object.entries(groupedChats)
                        .sort(([keyA], [keyB]) => keyB.localeCompare(keyA))
                        .map(([key, section]) => (
                            <ChatSection key={key} {...section} />
                        ))
                    }
                </ScrollView>
                <TouchableOpacity
                    style={styles.newChatButton}
                    onPress={handleNewChat}
                    accessible={true}
                    accessibilityLabel="Start a new chat"
                    accessibilityRole="button"
                >
                    <Text style={styles.newChatText}>Start a new thread</Text>
                    <View style={styles.newChatIconContainer}>
                        <PlusButton />
                    </View>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    screenContainer: {
        flex: 1,
        backgroundColor: customColors.softsand,
    },
    mainContent: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 20,
    },
    logoContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: customColors.beige2,
    },
    logoImage: {
        width: 24,
        height: 24,
    },
    headerText: {
        marginTop: 16,
        fontSize: 48,
        fontWeight: '900',
        color: '#212120',
        letterSpacing: -0.96,
    },
    chatsContainer: {
        flex: 1,
        marginTop: 21,
    },
    newChatButton: {
        position: 'absolute',
        bottom: 16,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderRadius: 24,
        padding: 12,
    },
    newChatText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#212120',
    },
    newChatIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#A181E3',
        justifyContent: 'center',
        alignItems: 'center',
    },
    newChatIcon: {
        width: 16,
        height: 16,
    },
});