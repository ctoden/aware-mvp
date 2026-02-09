import React from 'react';
import {View} from 'react-native-ui-lib';
import themeObject from '@app/constants/theme';
import {ChatScreen} from "@src/components/chat/ChatScreen";

export default function Chat() {
  return (
    <View flex style={{ backgroundColor: themeObject.colorScheme.light.background }}>
      <ChatScreen />
    </View>
  );
}