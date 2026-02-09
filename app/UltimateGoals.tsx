import React from 'react';
import {View} from 'react-native-ui-lib';
import themeObject from '@app/constants/theme';
import UltimateGoalsScreen from "@src/components/ultimateGoals/UltimateGoalsScreen";

export default function UltimateGoals() {
  return (
    <View flex style={{ backgroundColor: themeObject.colorScheme.light.background }}>
      <UltimateGoalsScreen />
    </View>
  );
} 