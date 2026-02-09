import React from 'react';
import {View} from 'react-native-ui-lib';
import themeObject from '@app/constants/theme';
import {UserProfileInsightDetailScreen} from "@src/components/userProfileInsightDetail/UserProfileInsightDetailScreen";

export default function UserProfileInsightDetail() {
  return (
    <View flex style={{ backgroundColor: themeObject.colorScheme.light.background }}>
      <UserProfileInsightDetailScreen />
    </View>
  );
} 