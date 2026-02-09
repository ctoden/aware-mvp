import React, { FC } from 'react';
import { observer } from '@legendapp/state/react';
import { Text, View } from 'react-native-ui-lib';
import themeObject from '@app/constants/theme';

export const CirclesScreen: FC = observer(() => {
    return (
        <View flex style={{ backgroundColor: themeObject.colors.background }}>
            <View padding-16>
                <Text h1>Circles</Text>
                <Text marginT-16>Coming soon</Text>
            </View>
        </View>
    );
});

export default CirclesScreen;
