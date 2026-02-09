import * as React from 'react';
import { View, Text, StyleSheet, TextStyle } from 'react-native';
import { ChatBubbleProps } from './types';
import { customColors } from '@app/constants/theme';
import { TypingIndicator } from './TypingIndicator';
import { useMemo } from 'react';
import Markdown from 'react-native-markdown-display';

export const ChatBubble: React.FC<ChatBubbleProps> = ({ text, isUser }) => {
    const trimmedText = useMemo(() => text.trim(), [text]);
    const isWaiting = !isUser && !trimmedText;
    
    return (
        <View style={[
            styles.bubbleContainer,
            isUser ? styles.userBubble : styles.botBubble,
            isWaiting && styles.waitingBubble,
            !isUser && !isWaiting && styles.responseBubble
        ]}>
            {isWaiting && <TypingIndicator isVisible={true} />}
            {!!trimmedText && (
                isUser ? (
                    <Text style={styles.messageText}>{text}</Text>
                ) : (
                    <Markdown style={markdownStyles}>
                        {text}
                    </Markdown>
                )
            )}
        </View>
    );
};

const markdownStyles = StyleSheet.create({
    body: {
        color: '#212120',
        fontSize: 16,
        letterSpacing: -0.16,
        lineHeight: 22,
    } as TextStyle,
    code_inline: {
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 3,
        paddingHorizontal: 4,
        paddingVertical: 2,
        fontFamily: 'monospace',
    } as TextStyle,
    code_block: {
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 4,
        padding: 8,
        marginVertical: 4,
        fontFamily: 'monospace',
    } as TextStyle,
    link: {
        color: customColors.lime,
        textDecorationLine: 'underline',
    } as TextStyle,
});

const styles = StyleSheet.create({
    bubbleContainer: {
        borderRadius: 25,
        paddingHorizontal: 16,
        paddingVertical: 16,
        marginVertical: 8,
        maxWidth: '80%',
    },
    userBubble: {
        alignSelf: 'flex-end',
        marginLeft: 24,
        backgroundColor: customColors.beige2,
    },
    botBubble: {
        alignSelf: 'flex-start',
        marginRight: 24,
        backgroundColor: '#FFFFFF',
    },
    waitingBubble: {
        backgroundColor: 'transparent',
    },
    responseBubble: {
        maxWidth: '95%',
    },
    messageText: {
        fontSize: 16,
        color: '#212120',
        letterSpacing: -0.16,
        lineHeight: 22,
    },
});