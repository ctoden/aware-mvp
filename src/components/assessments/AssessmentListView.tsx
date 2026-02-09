import React, { FC, useCallback } from 'react';
import { FlatList, ListRenderItem, TouchableOpacity } from 'react-native';
import { View } from 'react-native-ui-lib';
import { observer } from '@legendapp/state/react';
import { UserAssessment, userAssessments$ } from '@src/models/UserAssessment';
import { AssessmentCard } from './AssessmentCard';
import themeObject from '@app/constants/theme';
import { useRouter } from 'expo-router';

export const AssessmentListView: FC = observer(() => {
  const router = useRouter();

  const handleAssessmentPress = useCallback((assessment: UserAssessment) => {
    router.push('/AssessmentDetails');
  }, [router]);

  const renderAssessment: ListRenderItem<UserAssessment> = useCallback(({ item }) => (
    <TouchableOpacity
      onPress={() => handleAssessmentPress(item)}
    >
      <View marginR-s4 style={{ width: 200 }}>
        <AssessmentCard assessment={item} />
      </View>
    </TouchableOpacity>
  ), [handleAssessmentPress]); // Added handleAssessmentPress to dependencies

  return (
    <View>
      <FlatList
        data={userAssessments$.get()}
        renderItem={renderAssessment}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingStart: 0,
          paddingHorizontal: themeObject.spacings.s2,
          paddingVertical: themeObject.spacings.s2,
        }}
      />
    </View>
  );
});

AssessmentListView.displayName = 'AssessmentListView'; 
