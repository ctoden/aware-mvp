import { customColors } from '@app/constants/theme';
import React, { FC, useCallback, useState } from 'react';
import { StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Colors, Text, TouchableOpacity, View } from 'react-native-ui-lib';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AdvancedInput } from "@src/components/advancedInput/Advancedinput";
import { useViewModel } from '@src/hooks/useViewModel';
import { NavigationViewModel } from '@src/viewModels/NavigationViewModel';
import { FTUX_Routes } from '@src/models/NavigationModel';
import { UserShortTermGoalViewModel } from '@src/viewModels/UserShortTermGoalViewModel';
import { showErrorToast, showSuccessToast } from '@src/utils/ToastUtils';
import typography from 'react-native-ui-lib/src/style/typography';

export const ShortTermGoalsScreen: FC = () => {
    const [shortTermGoal, setShortTermGoal] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { viewModel: navigationVM } = useViewModel(NavigationViewModel);
    const { viewModel: shortTermGoalVM } = useViewModel(UserShortTermGoalViewModel);
    const continueEnabled = shortTermGoal.length > 0;

    const navigateToAddRelationships = useCallback(() => {
        router.push(navigationVM.getRouteFor(FTUX_Routes.AddRelationships));
    }, [navigationVM]);

    const handleNavigateToIndex = useCallback(() => {
        navigationVM.navigateToIndex();
    }, [navigationVM]);

    const saveShortTermGoal = useCallback(async () => {
        if (!shortTermGoal) return;
        const result = await shortTermGoalVM.addUserShortTermGoal(shortTermGoal);
        if (result.isErr()) {
            showErrorToast('Failed to save goal', result.error.message);
        }
    }, [shortTermGoal, shortTermGoalVM]);

    const handleSubmit = useCallback(async () => {
        setIsSubmitting(true);
        await saveShortTermGoal();
        setIsSubmitting(false)
        navigationVM.navigateToMyData();
    }, [saveShortTermGoal, navigationVM]);

    const handleDone = useCallback(async () => {
        await saveShortTermGoal();
        router.push(navigationVM.getRouteFor(FTUX_Routes.IntroducingYou));
    }, [saveShortTermGoal, navigationVM]);

    const handleContinue = useCallback(async () => {
        if (!shortTermGoal) {
            showErrorToast('Must enter a goal to continue', '');
            return;
        }
        await saveShortTermGoal();
        navigateToAddRelationships();
    }, [shortTermGoal, saveShortTermGoal, navigateToAddRelationships]);

    const handleGoalChange = useCallback((value: string) => {
        setShortTermGoal(value);
    }, []);

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 75 : 75}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                keyboardShouldPersistTaps="handled"
            >
                <View flex padding-page style={{ backgroundColor: Colors.backgroundLight }}>
                    {
                        !navigationVM.getIsMyData() ? (
                            <>
                                <View row spread marginB-20>
                                    <TouchableOpacity onPress={() => navigationVM.navigateToPreviousFTUXRoute(FTUX_Routes.ShortTermGoals)}>
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
                                    <Text labelText>4/9</Text>
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
                        <Text h2>Anything you're working on right now?</Text>
                    </View>
                    <View left marginT-20>
                        <Text labelRegular>What's on your mind lately? 💭</Text>
                    </View>
                    <View left marginT-20 width={'100%'}>
                        <AdvancedInput
                            label={"Short-term goals"}
                            value={shortTermGoal}
                            onChange={handleGoalChange}
                        />
                    </View>
                    <View style={styles.addButtonContainer}>
                        <TouchableOpacity
                            style={[styles.addButton, !continueEnabled && styles.disabledButton]}
                            onPress={navigationVM.getIsMyData() ? handleSubmit : handleContinue}
                            disabled={!continueEnabled}
                        >
                            <Text style={styles.addButtonText}>Add</Text>
                        </TouchableOpacity>
                    </View>

                    {
                        !navigationVM.getIsMyData() &&
                        (
                            <View style={styles.bottomContainer}>
                                <TouchableOpacity
                                    style={[styles.doneButton, !continueEnabled && styles.disabledButton]}
                                    onPress={handleContinue}
                                    disabled={!continueEnabled}
                                >
                                    <Text style={styles.doneButtonText}>Continue</Text>
                                    <Ionicons name="arrow-forward" size={20} color="#FFF" />
                                </TouchableOpacity>
                                <View flex>
                                    <TouchableOpacity
                                        onPress={navigateToAddRelationships}
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
                </View>
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

export default ShortTermGoalsScreen;
