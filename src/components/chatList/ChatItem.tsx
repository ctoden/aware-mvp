import * as React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChatItemProps } from './types';
import { customColors } from "@app/constants/theme";
import Toast from 'react-native-toast-message';
import { currentChatId$ } from '@src/models/Chat';
import { router } from 'expo-router';
import { NavigationViewModel } from '@src/viewModels/NavigationViewModel';
import { useViewModel } from '@src/hooks/useViewModel';

export const ChatItem: React.FC<ChatItemProps> = ({ id, emoji, title, content }) => {
    const { viewModel } = useViewModel(NavigationViewModel);
    const handlePress = () => {
        const unSub = currentChatId$.onChange((_) => {
            unSub();
            console.log("~~~~ Changing routes");
            router.navigate(`/${viewModel.getCurrentLayout()}/Chat`);
        })

        currentChatId$.set(id);

        Toast.show({
            type: 'info',
            text1: title,
            text2: `Chat ID: ${id}`,
            position: 'bottom',
            visibilityTime: 2000,
        });
    };

    return (
        <TouchableOpacity
            style={styles.chatContainer}
            onPress={handlePress}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Chat with ${title}`}
        >
            <View style={styles.chatHeader}>
                <View style={styles.emojiContainer}>
                    <Text>{emoji}</Text>
                </View>
                <View style={styles.titleContainer}>
                    <Text style={styles.titleText}>{title}</Text>
                </View>
                <View />
            </View>
            <View style={styles.contentContainer}>
                <Text style={styles.contentText} numberOfLines={2}>{content}</Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    chatContainer: {
        borderRadius: 24,
        backgroundColor: '#E1DCCE',
        marginTop: 8,
        width: '100%',
        padding: 16,
    },
    chatHeader: {
        backgroundColor: "#D4C7B6",
        borderRadius: 16,
        justifyContent: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 4,
        paddingLeft: 4,
        paddingRight: 12,
    },
    emojiContainer: {
        padding: 4,
    },
    titleContainer: {
        // flex: 1,
    },
    filler: {

    },
    titleText: {
        color: customColors.black1,
        textAlign: 'left',
        fontSize: 12,
        fontStyle: 'normal',
        fontWeight: '600',
        lineHeight: 18,
        letterSpacing: -0.12,
    },
    contentContainer: {
        marginTop: 8,
    },
    contentText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#212120',
    },
});