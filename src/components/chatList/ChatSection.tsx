import * as React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ChatItem } from './ChatItem';
import { ChatSectionProps } from './types';

export const ChatSection: React.FC<ChatSectionProps> = ({ label, chats }) => {
    return (
        <View style={styles.sectionContainer}>
            <Text style={styles.sectionLabel}>{label}</Text>
            {chats.map((chat, index) => (
                <ChatItem
                    key={`${label}-${index}`}
                    {...chat}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    sectionContainer: {
        marginVertical: 8,
    },
    sectionLabel: {
        color: '#545452',
        fontSize: 12,
        fontWeight: '400',
        letterSpacing: -0.12,
        marginBottom: 4,
    },
});