import React from 'react';
import {View} from 'react-native-ui-lib';
import themeObject from '@app/constants/theme';
import AlmostDoneScreen from "@src/components/almostDone/AlmostDoneScreen";

export default function AlmostDone() {
  return (
    <View flex style={{ backgroundColor: themeObject.colorScheme.light.background }}>
      <AlmostDoneScreen />
    </View>
  );
}
