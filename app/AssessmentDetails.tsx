
import React from 'react';
import { View } from 'react-native-ui-lib';
import themeObject from '@app/constants/theme';
import { AssessmentDetailsScreen } from '@src/components/assessmentDetails/AssessmentDetailsScreen';

export default function AssessmentDetails() {
    return (
        <View flex style={{ backgroundColor: themeObject.colorScheme.light.background }}>
            <AssessmentDetailsScreen />
        </View>
    );
} 