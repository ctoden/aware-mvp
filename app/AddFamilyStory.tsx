import React from 'react';
import { View } from 'react-native-ui-lib';
import themeObject from '@app/constants/theme';
import { AddFamilyStoryScreen } from "@src/components/familyStory/AddFamilyStoryScreen";

export default function AddFamilyStoryTab() {
  return (
    <View flex style={{ backgroundColor: themeObject.colorScheme.light.background }}>
      <AddFamilyStoryScreen />
    </View>
  );
} 