import React from 'react';
import { View } from 'react-native-ui-lib';
import themeObject from '@app/constants/theme';
import { InsightDetailsScreen } from '@src/components/insightDetails';

export default function InsightDetails() {
    return (
        <View flex style={{ backgroundColor: themeObject.colorScheme.light.background }}>
            <InsightDetailsScreen />
        </View>
    );
} 