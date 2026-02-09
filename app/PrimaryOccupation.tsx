import React from 'react';
import { View } from 'react-native-ui-lib';
import themeObject from '@app/constants/theme';
import { PrimaryOccupationScreen } from "@src/components/primaryOccupation/PrimaryOccupationScreen";

export default function PrimaryOccupationTab() {
  return (
    <View flex style={{ backgroundColor: themeObject.colorScheme.light.background }}>
      <PrimaryOccupationScreen />
    </View>
  );
} 