import { customColors } from '@app/constants/theme';
import React, { FC, useCallback, useEffect, useState } from 'react';
import { StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Colors, Text, TouchableOpacity, View } from 'react-native-ui-lib';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AdvancedInput } from '@src/components/advancedInput/Advancedinput';
import { useViewModel } from '@src/hooks/useViewModel';
import { NavigationViewModel } from '@src/viewModels/NavigationViewModel';
import { FTUX_Routes } from '@src/models/NavigationModel';
import { UserLongTermGoalViewModel } from '@src/viewModels/UserLongTermGoalViewModel';
import { showErrorToast } from '@src/utils/ToastUtils';
import typography from 'react-native-ui-lib/src/style/typography';
import { FTUX } from '../text/types';

export const UltimateGoalsScreen: FC = () => {
    const [longTermGoal, setLongTermGoal] = useState('');
    const { viewModel: navigationVM } = useViewModel(NavigationViewModel);
    const { viewModel: longTermGoalVM } = useViewModel(UserLongTermGoalViewModel);
    const continueEnabled = longTermGoal.length > 0;
    const [isSubmitting, setIsSubmitting] = useState(false);

    const navigateToShortTermGoals = useCallback(() => {
        router.push(navigationVM.getRouteFor(FTUX_Routes.ShortTermGoals));
    }, [navigationVM]);

    const saveLongTermGoal = useCallback(async () => {
        if (!longTermGoal) return;
        const result = await longTermGoalVM.addUserLongTermGoal(longTermGoal);
        if (result.isErr()) {
            showErrorToast('Failed to save goal', result.error.message);
        }
    }, [longTermGoal, longTermGoalVM]);

    const handleSubmit = useCallback(async () => {
        setIsSubmitting(true);
        await saveLongTermGoal();
        setIsSubmitting(false);
        router.back();
    }, [saveLongTermGoal, navigationVM]);

    const handleDone = useCallback(async () => {
        await saveLongTermGoal();
        router.push(navigationVM.getRouteFor(FTUX_Routes.IntroducingYou));
    }, [saveLongTermGoal, navigationVM]);


    const handleContinue = useCallback(async () => {
        if (!longTermGoal) {
            showErrorToast('Must enter a goal to continue', '');
            return;
        }
        await saveLongTermGoal();
        router.push(navigationVM.getRouteFor(FTUX_Routes.ShortTermGoals));
    }, [longTermGoal, saveLongTermGoal, navigationVM]);

    const handleGoalChange = useCallback((value: string) => {
        setLongTermGoal(value);
    }, []);

    useEffect(() => {
        //navigationVM.setIsMyData(false);
    }, [isSubmitting]);

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 75 : 75}>
            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                keyboardShouldPersistTaps='handled'>
                <View flex padding-page style={{ backgroundColor: Colors.backgroundLight }}>
                    {
                        !navigationVM.getIsMyData() ? (
                            <>
                                <View row spread marginB-20>
                                    <TouchableOpacity onPress={() => navigationVM.navigateToPreviousFTUXRoute(FTUX_Routes.UltimateGoals)}>
                                        <Text buttonRegular>
                                            Back
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={handleDone}>
                                        <Text buttonRegular>
                                            Done
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                <View center left br50 paddingH-8 paddingV-4 style={{ backgroundColor: customColors.beige2, width: 40 }}>
                                    <Text labelText>3/9</Text>
                                </View>
                            </>
                        ) : (
                            <View row spread marginB-s8>
                                <TouchableOpacity onPress={() => router.back()}>
                                    <Text style={typography.bodyLBold}>
                                        Cancel
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={handleSubmit}>
                                    <Text style={[typography.bodyLBold]}>
                                        Done
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )
                    }
                    <View left marginT-20>
                        <Text h2>What are your ultimate goals?</Text>
                    </View>
                    <View left marginT-20>
                        <Text labelRegular>Dream big—include personal, professional, or other aspirations for the future. ✍️</Text>
                    </View>
                    <View left marginT-20 width={'100%'}>
                        <AdvancedInput
                            label={'Long-term goals'}
                            value={longTermGoal}
                            onChange={handleGoalChange}
                        />
                    </View>
                    <View style={styles.addButtonContainer}>
                        <TouchableOpacity
                            style={[styles.addButton, !continueEnabled && styles.disabledButton]}
                            onPress={handleContinue}
                            disabled={!continueEnabled}
                        >
                            <Text style={styles.addButtonText}>Add</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                {!navigationVM.getIsMyData() &&
                    (
                    <View style={FTUX.bottomContainer}>
                            <TouchableOpacity
                                style={[styles.doneButton, !continueEnabled && styles.disabledButton]}
                                onPress={handleContinue}
                                disabled={!continueEnabled}
                            >
                                <Text style={styles.doneButtonText}>Continue</Text>
                            <Ionicons name='arrow-forward' size={20} color='#FFF' />
                            </TouchableOpacity>
                            <View flex>
                                <TouchableOpacity
                                    onPress={navigateToShortTermGoals}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <Text labelSecondary underline>
                                        Skip for now
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )
                }
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.backgroundLight,
    },
    scrollContainer: {
        flexGrow: 1,
        minHeight: '100%',
    },
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
    doneButton: {
        backgroundColor: '#000',
        padding: 16,
        borderRadius: 24,
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    disabledButton: {
        opacity: 0.5,
    },
    doneButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '500',
    },
    addButtonContainer: {
        width: '100%',
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 16,
    },
    addButton: {
        backgroundColor: customColors.beige3,
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 24,
        minWidth: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addButtonText: {
        color: '#000000',
        fontSize: 16,
        fontWeight: '500',
    },
});

export default UltimateGoalsScreen;
