import * as React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { ChatHeaderProps } from './types';
import { useRouter } from 'expo-router';
import { useViewModel } from '@src/hooks/useViewModel';
import { NavigationViewModel } from '@src/viewModels/NavigationViewModel';
import BackArrow from '../icons/BackArrow';
import { customColors } from '@app/constants/theme';
import ChatListButton from '../icons/ChatListButton';

export const ChatHeader: React.FC<ChatHeaderProps> = ({ title, iconUrl, onIconPress }) => {
    const router = useRouter();
    const { viewModel} = useViewModel(NavigationViewModel);

    const handleIconPress = () => {
        if (onIconPress) {
            onIconPress();
            return;
        }
        
        const layout = viewModel.getCurrentLayout();
        router.navigate(`/${layout}/ChatList`);
    };

    const handleBackPress = () => {
        router.back();
    };

    return (
        <View style={styles.headerContainer}>
            <TouchableOpacity 
                style={styles.iconContainer} 
                onPress={handleBackPress}
                testID="chat-header-icon"
            >
                <BackArrow />
            </TouchableOpacity>
            <Text style={styles.headerTitle} testID='chat-header-title'>{title}</Text>
            <TouchableOpacity 
                style={styles.iconContainer} 
                onPress={handleIconPress}
                testID="chat-header-icon"
            >
                <ChatListButton />
            </TouchableOpacity>
            </View>
    );
};

const styles = StyleSheet.create({
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 50,
        height: 50,
        paddingTop: 20,
        gap: 20,
    },
    iconContainer: {
        borderRadius: 50,
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        backgroundColor: customColors.beige2,
    },
    headerIcon: {
        width: 24,
        aspectRatio: 1,
    },
    headerTitle: {
        color: '#212120',
        fontSize: 24,
        fontWeight: '600',
        letterSpacing: -0.34,
    },
});