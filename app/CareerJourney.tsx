import React from 'react';
import { View } from 'react-native-ui-lib';
import themeObject from '@app/constants/theme';
import { CareerJourneyScreen } from "@src/components/careerJourney/CareerJourneyScreen";

export default function CareerJourneyTab() {
  return (
    <View flex style={{ backgroundColor: themeObject.colorScheme.light.background }}>
      <CareerJourneyScreen />
    </View>
  );
} 