import * as React from 'react';
import { View, ScrollView, StyleSheet, Platform, KeyboardAvoidingView, NativeSyntheticEvent, TextInputKeyPressEventData } from 'react-native';
import { ChatHeader } from './ChatHeader';
import { ChatBubble } from './ChatBubble';
import { ChatInput } from './ChatInput';
import { observer } from '@legendapp/state/react';
import { useViewModel } from '@src/hooks/useViewModel';
import { ChatViewModel } from '@src/viewModels/ChatViewModel';
import {currentChatId$, getMessagesForChat} from '@src/models/Chat';
import { useEffect, useRef } from 'react';
import {nanoid} from "nanoid";

export const ChatScreen: React.FC = observer(() => {
    const chatId = currentChatId$.get();
    const { viewModel: chatViewModel, isInitialized } = useViewModel(ChatViewModel, { chatId, id: nanoid(5) });
    const currentChatId = chatViewModel.state.currentChatId.get();
    const messages = currentChatId ? getMessagesForChat(currentChatId) : [];
    const isLoading = chatViewModel.state.isLoading.get();
    const inputText = chatViewModel.state.inputText.get();
    const scrollViewRef = useRef<ScrollView>(null);

    // Scroll to bottom on initial render and when messages change
    useEffect(() => {
        setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100); // Small delay to ensure content is rendered
    }, [messages.length]);

    useEffect(() => {
        console.log("~~~~ useEffect Chat id: ", chatId);
        chatViewModel.switchChat(chatId ?? null);
    }, [chatId]);

    useEffect(() => {
        console.log("~~~~ checking for auto chat message to send: ");
        chatViewModel.sendAutoMessage();
    }, [chatViewModel.hasAutoMessage]);

    const handleSend = async () => {
        const result = await chatViewModel.sendMessage();
        if (result.isErr()) {
            console.error(result.error);
        } else {
            // Scroll to bottom after sending message
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    };

    const handleInputChange = (text: string) => {
        chatViewModel.setInputText(text);
    };

    const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
        if (Platform.OS === 'web') {
            const { key, shiftKey } = e.nativeEvent as any;
 
            if (shiftKey && key === 'Enter') {
                e.preventDefault(); // Prevent default behavior if necessary
                handleSend();
            }
        }
    };

    if (!isInitialized) {
        return null; // or a loading indicator
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
        >
            <View style={styles.container}>
                <ChatHeader
                    title={chatViewModel.state.currentChatTitle.get() ?? ''}
                    iconUrl="https://cdn.builder.io/api/v1/image/assets/49f9222b7d4543e099417d52e6a4eba4/2b7183bb77762fccbd87d186275e86c133c3117eb6192dee02450f25e3f06601?apiKey=49f9222b7d4543e099417d52e6a4eba4&"
                />
                <ScrollView 
                    ref={scrollViewRef}
                    style={styles.messageContainer}
                    contentContainerStyle={styles.messageContentContainer}
                >
                    {messages.map((message) => (
                        <ChatBubble
                            key={message.id}
                            text={message.content}
                            isUser={message.sender === 'user'}
                        />
                    ))}
                </ScrollView>
                <ChatInput 
                    onSend={handleSend} 
                    isLoading={isLoading} 
                    value={inputText}
                    onChangeText={handleInputChange}
                    onKeyPress={handleKeyPress}
                />
            </View>
        </KeyboardAvoidingView>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginHorizontal: 'auto',
        width: '100%',
        paddingHorizontal: 20,
        backgroundColor: '#F0EBE4',
    },
    messageContainer: {
        flex: 1,
        marginTop: 26,
        paddingBottom: 128,
    },
    messageContentContainer: {
        flexGrow: 1,
        justifyContent: 'flex-end',
    },
});