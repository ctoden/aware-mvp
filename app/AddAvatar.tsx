import React from 'react';
import { Platform } from 'react-native';
import { View } from 'react-native-ui-lib';
import themeObject from '@app/constants/theme';
import { AddAvatarScreen } from '@src/components/addAvatar/AddAvatarScreen';
import { AvatarComingSoonScreen } from '@src/components/addAvatar/AvatarComingSoonScreen';

export default function AddAvatarTab() {
    return (
        <View flex style={{ backgroundColor: themeObject.colorScheme.light.background }}>
            {/* {Platform.OS === 'ios' ? <AddAvatarScreen /> : <AvatarComingSoonScreen />} */}
            <AvatarComingSoonScreen />
        </View>
    );
} 