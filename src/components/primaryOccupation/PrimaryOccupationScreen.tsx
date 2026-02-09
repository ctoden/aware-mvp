import React, { FC, useCallback } from 'react';
import { StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Colors, Text, TouchableOpacity, View, TextField } from 'react-native-ui-lib';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { customColors } from '@app/constants/theme';
import { PrimaryOccupationViewModel } from '@src/viewModels/PrimaryOccupationViewModel';
import { Memo } from '@legendapp/state/react';
import { FTUX_Routes } from '@src/models/NavigationModel';
import { useViewModel } from '@src/hooks/useViewModel';
import { NavigationViewModel } from '@src/viewModels/NavigationViewModel';
import typography from 'react-native-ui-lib/src/style/typography';

export const PrimaryOccupationScreen: FC = () => {
    const { viewModel: navigationVM } = useViewModel(NavigationViewModel);
    const { viewModel: occupationVM, isInitialized } = useViewModel(PrimaryOccupationViewModel);
    const inputId = React.useId();
    
    const handleNavigateToIndex = useCallback(() => {
        navigationVM.navigateToIndex();
    }, [navigationVM]);

    const handleDone = useCallback(async () => {
        await occupationVM.saveOccupation();
        router.push(navigationVM.getRouteFor(FTUX_Routes.IntroducingYou));
    }, [occupationVM, navigationVM]);

    const handleContinue = useCallback(async () => {
        const result = await occupationVM.saveOccupation();
        if (result.isOk()) {
            router.push(navigationVM.getRouteFor(FTUX_Routes.CareerJourney));
        }
    }, [navigationVM, occupationVM]);

    if (!isInitialized) {
        return null; // Or a loading indicator
    }

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
                                    <TouchableOpacity onPress={() => navigationVM.navigateToPreviousFTUXRoute(FTUX_Routes.PrimaryOccupation)}>
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
                                    <Text labelText>7/9</Text>
                                </View>
                            </>
                        ) : (
                            <View row spread marginB-s8>
                                <TouchableOpacity onPress={() => router.back()}>
                                    <Text style={typography.bodyLBold}>
                                        Cancel
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => navigationVM.navigateToMyData()}>
                                    <Text style={[typography.bodyLBold]}>
                                        Done
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )
                    }
                    <View left marginT-20>
                        <Text h2>What is your primary occupation?</Text>
                    </View>
                    <View left marginT-20>
                        <Text labelRegular>This helps us understand your professional background.</Text>
                    </View>
                    
                    <View flex>
                        <View style={styles.inputContainer}>
                            <View style={styles.labelContainer}>
                                <Text
                                    style={styles.label}
                                    nativeID={`${inputId}-label`}
                                    accessibilityRole="text"
                                >
                                    Primary Occupation
                                </Text>
                            </View>
                            <Memo>
                                {() => (
                                    <TextField
                                        value={occupationVM.occupation$.get()}
                                        onChangeText={(text) => occupationVM.updateOccupation(text)}
                                        placeholder="Enter your primary occupation..."
                                        multiline
                                        style={styles.input}
                                        testID="primary-occupation-input"
                                        accessibilityLabel="Primary Occupation"
                                        accessibilityLabelledBy={`${inputId}-label`}
                                    />
                                )}
                            </Memo>
                        </View>
                    </View>

                    {!navigationVM.getIsMyData() && (
                        <View style={styles.bottomContainer}>
                            <Memo>
                                {() => (
                                    <TouchableOpacity
                                        style={[
                                            styles.continueButton,
                                            !occupationVM.isValid$.get() && styles.disabledButton
                                        ]}
                                        onPress={handleContinue}
                                        disabled={!occupationVM.isValid$.get()}
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
});

export default PrimaryOccupationScreen; 
