import React from 'react';
import {View} from 'react-native-ui-lib';
import themeObject from '@app/constants/theme';
import {AddRelationshipsScreen} from "@src/components/relationshipDetails/AddRelationshipsScreen";

export default function AddRelationshipsTab() {
  return (
    <View flex style={{ backgroundColor: themeObject.colorScheme.light.background }}>
      <AddRelationshipsScreen />
    </View>
  );
} 