import React from 'react';
import {View} from 'react-native-ui-lib';
import themeObject from '@app/constants/theme';
import BirthDateScreen from "@src/components/birthDate/BirthDateScreen";

export default function BirthDate() {
  return (
    <View flex style={{ backgroundColor: themeObject.colorScheme.light.background }}>
      <BirthDateScreen />
    </View>
  );
} 