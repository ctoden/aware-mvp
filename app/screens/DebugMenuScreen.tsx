import React, { FC, useCallback } from 'react';
import { FlatList, TouchableOpacity } from 'react-native';
import { View, Text } from 'react-native-ui-lib';
import { FTUX_Routes, ScreenRoutes } from '@src/models/NavigationModel';
import { useViewModel } from '@src/hooks/useViewModel';
import { NavigationViewModel } from '@src/viewModels/NavigationViewModel';
import { observer } from '@legendapp/state/react';
import themeObject from '@app/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { H1 } from '@src/components/text/H1';

export const DebugMenuScreen: FC = observer(() => {
    const { viewModel: navigationViewModel } = useViewModel(NavigationViewModel);

    const routes = Object.values(FTUX_Routes);

    const handleBackPress = useCallback(() => {
        navigationViewModel.navigateToIndex();
    }, [navigationViewModel]);

    const renderItem = useCallback(({ item }: { item: FTUX_Routes }) => (
        <TouchableOpacity
            onPress={() => {
                navigationViewModel.navigation.frozenRoute.set(item);
            }}
        >
            <View 
                style={{ 
                    padding: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: themeObject.colors.border 
                }}
            >
                <Text bodyRegular>{item}</Text>
            </View>
        </TouchableOpacity>
    ), [navigationViewModel]);

    return (
        <View flex style={{ backgroundColor: themeObject.colors.background }}>
            <View row centerV padding-16>
                <TouchableOpacity onPress={handleBackPress}>
                    <Ionicons 
                        name="chevron-back" 
                        size={24} 
                        color={themeObject.colors.text}
                        style={{ marginRight: 8 }}
                    />
                </TouchableOpacity>
                <H1>Debug Menu</H1>
            </View>
            <View paddingH-16 marginB-16>
                <Text bodyRegular>Select a screen to navigate to:</Text>
            </View>
            <FlatList
                data={routes}
                renderItem={renderItem}
                keyExtractor={(item) => item}
            />
        </View>
    );
});

export default DebugMenuScreen; 