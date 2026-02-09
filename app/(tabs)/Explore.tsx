import React from 'react';
import { View } from 'react-native-ui-lib';
import themeObject from '@app/constants/theme';
import { ExploreScreen } from "@src/components/explore/ExploreScreen";

export default function Explore() {
  return (
    <View flex style={{ backgroundColor: themeObject.colorScheme.light.background }}>
      <ExploreScreen />
    </View>
  );
} 