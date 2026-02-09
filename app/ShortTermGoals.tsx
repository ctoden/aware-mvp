import React from 'react';
import {View} from 'react-native-ui-lib';
import themeObject from '@app/constants/theme';
import {ShortTermGoalsScreen} from "@src/components/shortTermGoals/ShortTermGoalsScreen";

export default function ShortTermGoalsTab() {
  return (
    <View flex style={{ backgroundColor: themeObject.colorScheme.light.background }}>
      <ShortTermGoalsScreen />
    </View>
  );
} 