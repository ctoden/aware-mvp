import React, { FC, useCallback } from 'react';
import { StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Colors, Text, TouchableOpacity, View, TextField } from 'react-native-ui-lib';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { customColors } from '@app/constants/theme';
import { FamilyStoryViewModel } from '@src/viewModels/FamilyStoryViewModel';
import { Memo } from '@legendapp/state/react';
import { FTUX_Routes } from '@src/models/NavigationModel';
import { useViewModel } from '@src/hooks/useViewModel';
import { NavigationViewModel } from '@src/viewModels/NavigationViewModel';
import typography from 'react-native-ui-lib/src/style/typography';
import { FTUX } from '../text/types';

export const AddFamilyStoryScreen: FC = () => {
    const { viewModel: navigationVM } = useViewModel(NavigationViewModel);
    const { viewModel: familyStoryVM } = useViewModel(FamilyStoryViewModel);
    const inputId = React.useId();

    const handleDone = useCallback(async () => {
        await familyStoryVM.saveStory();
        router.push(navigationVM.getRouteFor(FTUX_Routes.IntroducingYou));
    }, [familyStoryVM, navigationVM]);

    const handleContinue = useCallback(async () => {
        const result = await familyStoryVM.saveStory();
        if (result.isOk()) {
            router.push(navigationVM.getRouteFor(FTUX_Routes.PrimaryOccupation));
        }
    }, [navigationVM, familyStoryVM]);

    const handleSubmit = useCallback(async () => {
        const result = await familyStoryVM.saveStory();
        if (result.isOk()) {
            navigationVM.navigateToMyData();
        }
    }, [familyStoryVM, navigationVM]);

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
                <View flex flex-1 padding-page style={{ backgroundColor: Colors.backgroundLight }}>
                    {
                        !navigationVM.getIsMyData() ? (
                            <>
                                <View row spread marginB-20>
                                    <TouchableOpacity onPress={() => navigationVM.navigateToPreviousFTUXRoute(FTUX_Routes.AddFamilyStory)}>
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
                            </>
                        ) : (
                            <View row spread marginB-s8>
                                <TouchableOpacity onPress={() => router.back()}>
                                    <Text style={typography.bodyLBold}>
                                        Cancel
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleSubmit}>
                                    <Text style={[typography.bodyLBold]}>
                                        Done
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )
                    }
                    <View center left br50 paddingH-8 paddingV-4 style={{ backgroundColor: customColors.beige2, width: 40 }}>
                        <Text labelText>6/9</Text>
                    </View>
                    <View left marginT-20>
                        <Text h2>What's your family's story?</Text>
                    </View>
                    <View left marginT-20>
                        <Text labelRegular>Details such as names and relationships help personalize your advice.</Text>
                    </View>

                    <View>
                        <View style={styles.inputContainer}>
                            <View style={styles.labelContainer}>
                                <Text
                                    style={styles.label}
                                    nativeID={`${inputId}-label`}
                                    accessibilityRole="text">
                                    Family Story
                                </Text>
                            </View>
                            <Memo>
                                {() => (
                                    <TextField
                                        value={familyStoryVM.story$.get()}
                                        onChangeText={familyStoryVM.updateStory}
                                        placeholder="Share your family's story..."
                                        multiline
                                        style={styles.input}
                                        testID="family-story-input"
                                        accessibilityLabel="Family Story"
                                        accessibilityLabelledBy={`${inputId}-label`}
                                        enableErrors
                                        validateOnChange
                                    />
                                )}
                            </Memo>
                        </View>
                    </View>
                </View>
                {!navigationVM.getIsMyData() && (
                    <View style={FTUX.bottomContainer}>
                        <TouchableOpacity
                            style={[
                                styles.continueButton,
                                !familyStoryVM.isValid$.get() && styles.disabledButton
                            ]}
                            onPress={handleContinue}
                            disabled={!familyStoryVM.isValid$.get()}>
                            <Memo>
                                {() => (
                                    <>
                                        <Text style={styles.continueButtonText}>Continue</Text>
                                        <Ionicons name="arrow-forward" size={20} color="#FFF" />
                                    </>
                                )}
                            </Memo>
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
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        height: '100%',
    },
    scrollContainer: {
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

export default AddFamilyStoryScreen; 
