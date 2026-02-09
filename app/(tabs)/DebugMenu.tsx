import React from 'react';
import {View} from 'react-native-ui-lib';
import themeObject from '@app/constants/theme';
import {DebugMenuScreen} from "@app/screens/DebugMenuScreen";

export default function DebugMenu() {
  return (
    <View flex style={{ backgroundColor: themeObject.colorScheme.light.background }}>
      <DebugMenuScreen />
    </View>
  );
} 