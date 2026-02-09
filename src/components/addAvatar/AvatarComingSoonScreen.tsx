import React, { FC, useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { Colors, Text, TouchableOpacity, View } from 'react-native-ui-lib';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { customColors } from '@app/constants/theme';
import { useViewModel } from '@src/hooks/useViewModel';
import { FTUX_Routes } from '@src/models/NavigationModel';
import { NavigationViewModel } from '@src/viewModels/NavigationViewModel';

export const AvatarComingSoonScreen: FC = () => {
    const { viewModel: navigationVM } = useViewModel(NavigationViewModel);

    const handleNavigateToIndex = useCallback(() => {
        navigationVM.navigateToIndex();
    }, [navigationVM]);

    const handleContinue = useCallback(() => {
        router.push(navigationVM.getRouteFor(FTUX_Routes.IntroducingYou));
    }, [navigationVM]);

    return (
        <View flex padding-page style={{ backgroundColor: Colors.backgroundLight }}>
            <View row spread marginB-20>
                <TouchableOpacity onPress={handleNavigateToIndex}>
                    <Text buttonRegular>
                        Cancel
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleNavigateToIndex}>
                    <Text buttonRegular>
                        Done
                    </Text>
                </TouchableOpacity>
            </View>
            <View center left br50 paddingH-8 paddingV-4 style={{ backgroundColor: customColors.beige2, width: 40 }}>
                <Text labelText>9/9</Text>
            </View>

            <View flex center>
                <Text h2 center marginB-20>Only Available on iOS</Text>
                <Text labelRegular center>Coming Soon</Text>
            </View>

            <View style={styles.bottomContainer}>
                <TouchableOpacity
                    style={styles.continueButton}
                    onPress={handleContinue}
                >
                    <Text style={styles.continueButtonText}>Continue</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={handleContinue}
                    style={{ cursor: 'pointer' }}
                >
                    <Text labelSecondary underline>
                        Skip for now
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    bottomContainer: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 16,
    },
    continueButton: {
        backgroundColor: '#000',
        padding: 16,
        borderRadius: 24,
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    continueButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '500',
    },
});

export default AvatarComingSoonScreen; 