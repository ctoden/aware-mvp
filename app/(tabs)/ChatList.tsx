import React from 'react';
import {View} from 'react-native-ui-lib';
import themeObject from '@app/constants/theme';
import {ChatListScreen} from "@src/components/chatList/ChatListScreen";

export default function ChatList() {
  return (
    <View flex style={{ backgroundColor: themeObject.colorScheme.light.background }}>
      <ChatListScreen />
    </View>
  );
} 