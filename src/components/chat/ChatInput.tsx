import React, {useMemo} from 'react';
import {
    NativeSyntheticEvent,
    StyleSheet,
    TextInput,
    TextInputKeyPressEventData,
    TouchableOpacity,
    View
} from 'react-native';
import {customColors} from '@app/constants/theme';
import UpArrow from "@src/components/icons/UpArrow";

export interface ChatInputProps {
    onSend: () => void;
    isLoading: boolean;
    value: string;
    onChangeText: (text: string) => void;
    onKeyPress?: (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({ 
    onSend, 
    isLoading, 
    value, 
    onChangeText,
    onKeyPress 
}) => {
    const isDisabled = useMemo(()=> isLoading || !value, [isLoading, value]);
    return (
        <View style={styles.inputWrapper}>
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.textInput}
                    placeholder="Type a message"
                    placeholderTextColor="#666"
                    multiline
                    value={value}
                    onChangeText={onChangeText}
                    onKeyPress={onKeyPress}
                    editable={!isLoading}
                    accessibilityLabel="Message input"
                    textAlignVertical="center"
                />
                <TouchableOpacity
                    onPress={onSend}
                    disabled={isLoading}
                    style={[styles.sendButton, isDisabled && styles.sendButtonDisabled]}
                    accessibilityLabel="Send message"
                >
                    <UpArrow
                        style={styles.sendIcon}
                    />
                </TouchableOpacity>
            </View>
            <View style={styles.bottomBar} />
        </View>
    );
};

const styles = StyleSheet.create({
    inputWrapper: {
        zIndex: 10,
        width: '100%',
        minHeight: 102,
        paddingHorizontal: 16,
        paddingBottom: 10,
    },
    inputContainer: {
        borderRadius: 32,
        borderColor: '#D4C7B6',
        borderWidth: 2,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        backgroundColor: customColors.white,
    },
    textInput: {
        flex: 1,
        minWidth: 240,
        minHeight: 48,
        padding: 8,
        fontSize: 16,
        color: '#545452',
        letterSpacing: -0.24,
        paddingTop: 12,
        paddingBottom: 0,
        textAlignVertical: 'center',
    },
    sendButton: {
        borderRadius: 100,
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: customColors.beige2,
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
    sendIcon: {
        paddingLeft: 6,
        width: 24,
        height: 24,
    },
    bottomBar: {
        borderRadius: 4,
        alignSelf: 'center',
        height: 4,
        marginTop: 24,
        width: 100,
    },
});