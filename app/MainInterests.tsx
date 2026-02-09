import React from 'react';
import {View} from 'react-native-ui-lib';
import themeObject from '@app/constants/theme';
import {MainInterestsScreen} from "@src/components/mainInterests/MainInterestsScreen";

export default function MainInterest() {
  return (
    <View flex style={{ backgroundColor: themeObject.colorScheme.light.background }}>
      <MainInterestsScreen />
    </View>
  );
} 