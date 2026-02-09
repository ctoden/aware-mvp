import React from 'react';
import { View } from 'react-native-ui-lib';
import themeObject from '@app/constants/theme';
import { IntroducingYouScreen } from "@src/components/introducingYou/IntroducingYouScreen";

export default function IntroducingYouTab() {
  return (
    <View flex style={{ backgroundColor: themeObject.colorScheme.light.background }}>
      <IntroducingYouScreen />
    </View>
  );
} 