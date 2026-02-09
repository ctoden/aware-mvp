import React, { FC, useCallback } from 'react';
import { StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Colors, Text, TouchableOpacity, View, TextField } from 'react-native-ui-lib';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { customColors } from '@app/constants/theme';
import { CareerJourneyViewModel } from '@src/viewModels/CareerJourneyViewModel';
import { Memo, observer, useObservable } from '@legendapp/state/react';
import { FTUX_Routes } from '@src/models/NavigationModel';
import { useViewModel } from '@src/hooks/useViewModel';
import { NavigationViewModel } from '@src/viewModels/NavigationViewModel';
import { showErrorToast } from '@src/utils/ToastUtils';
import typography from 'react-native-ui-lib/src/style/typography';
import { FTUX } from '../text/types';
import CircularCloseButton from '../button/CircularCloseButton';

export const CareerJourneyScreen: FC = observer(() => {
    const { viewModel: navigationVM } = useViewModel(NavigationViewModel);
    const { viewModel: journeyVM, isInitialized } = useViewModel(CareerJourneyViewModel);
    const entries = useObservable(journeyVM.entries$);
    const baseInputId = React.useId();

    const handleDone = useCallback(async () => {
        const result = await journeyVM.saveEntries();
        if (result.isErr()) {
            showErrorToast('Failed to save career history');
            return;
        }
        if (navigationVM.getIsMyData()) {
            navigationVM.navigateToMyData();
        } else {
            router.push(navigationVM.getRouteFor(FTUX_Routes.IntroducingYou));
        }
    }, [journeyVM, navigationVM]);

    const handleContinue = useCallback(async () => {
        const result = await journeyVM.saveEntries();
        if (result.isErr()) {
            showErrorToast('Failed to save career history');
            return;
        }
        router.push(navigationVM.getRouteFor(FTUX_Routes.IntroducingYou));
    }, [navigationVM, journeyVM]);

    const handleAddEntry = useCallback(() => {
        journeyVM.addEntry();
    }, [journeyVM]);

    if (!isInitialized) {
        return null;
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 75 : 75}
        >
            <View flex padding-page style={{ backgroundColor: Colors.backgroundLight }}>
                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    keyboardShouldPersistTaps="handled"
                >
                    {
                        !navigationVM.getIsMyData() ? (
                            <>
                                <View row spread marginB-20>
                                    <TouchableOpacity onPress={() => navigationVM.navigateToPreviousFTUXRoute(FTUX_Routes.CareerJourney)}>
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
                                    <Text labelText>8/9</Text>
                                </View>
                            </>
                        ) : (
                            <View row spread marginB-s8>
                                <TouchableOpacity onPress={() => router.back()}>
                                    <Text style={typography.bodyLBold}>
                                        Cancel
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleDone}>
                                    <Text style={[typography.bodyLBold]}>
                                        Done
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )
                    }
                    <View style={styles.contentContainer}>
                        <View left marginT-20>
                            <Text h2>What has your career journey been like so far?</Text>
                        </View>
                        <View left marginT-20>
                            <Text labelRegular>Include previous and current positions, along with your professional goals for the future.</Text>
                        </View>

                        <View style={styles.entriesContainer}>
                            <ScrollView style={styles.entriesScrollView} contentContainerStyle={styles.entriesContentContainer}>
                                <Memo>
                                    {() => entries.get().map((entry, index) => {
                                        const inputId = `${baseInputId}-${index}`;
                                        return (
                                            <View key={entry.id} style={styles.inputContainer}>
                                                <View style={styles.labelContainer}>
                                                    <Text
                                                        style={styles.label}
                                                        nativeID={`${inputId}-label`}
                                                        accessibilityRole="text"
                                                    >
                                                        Position/Role
                                                    </Text>
                                                </View>
                                                <View flex row spread gap-4>
                                                    <TextField
                                                        value={entry.journey}
                                                        onChangeText={(text) => journeyVM.updateEntry(entry.id, text)}
                                                        placeholder="Describe your role and experience"
                                                        multiline
                                                        style={styles.input}
                                                        testID={`career-journey-input-${entry.id}`}
                                                        accessibilityLabel="Position/Role"
                                                        accessibilityLabelledBy={`${inputId}-label`}
                                                    />
                                                    <CircularCloseButton onPress={() => journeyVM.removeEntry(entry.id)} />
                                                </View>
                                            </View>
                                        );
                                    })}
                                </Memo>

                                <TouchableOpacity
                                    center marginT-20
                                    style={styles.addButton}
                                    onPress={handleAddEntry}
                                >
                                    <Text style={styles.addButtonText}>
                                        {journeyVM.entries$.peek().length === 0 ? 'Add position' : 'Add another position'}
                                    </Text>
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
                    </View>
                    {!navigationVM.getIsMyData() && (
                        <View style={FTUX.bottomContainer}>
                            <Memo>
                                {() => (
                                    <TouchableOpacity
                                        style={[
                                            styles.continueButton,
                                            !journeyVM.isValid$.get() && styles.disabledButton
                                        ]}
                                        onPress={handleContinue}
                                        disabled={!journeyVM.isValid$.get()}
                                    >
                                        <Text style={styles.continueButtonText}>Continue</Text>
                                        <Ionicons name="arrow-forward" size={20} color="#FFF" />
                                    </TouchableOpacity>
                                )}
                            </Memo>
                            <TouchableOpacity
                                onPress={handleContinue}
                                style={{ cursor: 'pointer' }}
                            >
                                <Text labelSecondary underline>
                                    Skip for now
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
            </View>
        </KeyboardAvoidingView>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.backgroundLight,
    },
    scrollContainer: {
        flexGrow: 1,
        minHeight: '100%',
    },
    entriesContainer: {
        flex: 1,
        marginTop: 20,

    },
    entriesScrollView: {
        flex: 1,
    },
    entriesContentContainer: {
        flexGrow: 1,
    },
    inputContainer: {
        marginTop: 20,
    },
    labelContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    label: {
        fontSize: 12,
        fontWeight: '400',
        color: '#545452',
    },
    input: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E2E2E2',
        borderRadius: 8,
        padding: 16,
        minHeight: 120,
        textAlignVertical: 'top',
        fontSize: 16,
        flexGrow: 1
    },
    addButton: {
        backgroundColor: customColors.beige2,
        padding: 16,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addButtonText: {
        color: Colors.textPrimary,
        fontSize: 16,
        fontWeight: '500',
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
    disabledButton: {
        opacity: 0.5,
    },
    continueButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '500',
    },
    contentContainer: {
        flexGrow: 1
    }
});

export default CareerJourneyScreen; 
