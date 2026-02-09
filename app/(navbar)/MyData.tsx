import React from 'react';
import {View} from 'react-native-ui-lib';
import themeObject from '@app/constants/theme';
import {MyDataScreen} from "@src/components/myData/MyDataScreen";

export default function MyData() {
  return (
    <View flex style={{ backgroundColor: themeObject.colors.background }}>
      <MyDataScreen />
    </View>
  );
} 