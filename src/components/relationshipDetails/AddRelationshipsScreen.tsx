import React, { FC, useCallback } from 'react';
import { StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Colors, Text, TouchableOpacity, View } from 'react-native-ui-lib';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { RelationshipDetailsItem } from './RelationshipDetailsItem';
import { RelationshipDetailsViewModel } from '@src/viewModels/RelationshipDetailsViewModel';
import { customColors } from '@app/constants/theme';
import { Memo, observer } from '@legendapp/state/react';
import { useViewModel } from '@src/hooks/useViewModel';
import { FTUX_Routes } from '@src/models/NavigationModel';
import { NavigationViewModel } from '@src/viewModels/NavigationViewModel';
import { UserInnerCircleViewModel } from '@src/viewModels/UserInnerCircleViewModel';
import { user$ } from '@src/models/SessionModel';
import { showErrorToast } from '@src/utils/ToastUtils';
import typography from 'react-native-ui-lib/src/style/typography';
import { FTUX } from '../text/types';

export const AddRelationshipsScreen: FC = observer(() => {
    const { viewModel } = useViewModel(RelationshipDetailsViewModel);
    const { viewModel: navigationVM } = useViewModel(NavigationViewModel);
    const { viewModel: innerCircleVM } = useViewModel(UserInnerCircleViewModel);
    const continueEnabled = viewModel.relationshipDetails$.get().length > 0;

    const handleNavigateToIndex = useCallback(() => {
        navigationVM.navigateToIndex();
    }, [navigationVM]);

    const saveRelationships = useCallback(async () => {
        const userId = user$.peek()?.id;
        if (!userId) {
            showErrorToast('Please log in to continue');
            return;
        }

        // Convert relationship details to inner circle members
        const result = await viewModel.convertToInnerCircle();
        if (result.isErr()) {
            showErrorToast('Failed to save relationships');
            return;
        }
    }, [viewModel]);

    const handleDone = useCallback(async () => {
        await saveRelationships();
        router.push(navigationVM.getRouteFor(FTUX_Routes.IntroducingYou));
    }, [saveRelationships, navigationVM]);

    const handleSubmit = useCallback(async () => {
        await saveRelationships();
        navigationVM.navigateToMyData();
    }, [saveRelationships, navigationVM]);

    const handleContinue = useCallback(async () => {
        await saveRelationships();
        router.push(navigationVM.getRouteFor(FTUX_Routes.AddFamilyStory));
    }, [saveRelationships, navigationVM]);

    const handleSkip = useCallback(() => {
        router.push(navigationVM.getRouteFor(FTUX_Routes.AddFamilyStory));
    }, [navigationVM]);

    const handleAddPerson = useCallback(() => {
        viewModel.addRelationship();
    }, [viewModel]);

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 75 : 75}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                keyboardShouldPersistTaps="handled">
                <View flex padding-page style={{ backgroundColor: Colors.backgroundLight }}>
                    {
                        !navigationVM.getIsMyData() ?
                            (
                                <>
                                    <View row spread marginB-20>
                                        <TouchableOpacity onPress={() => navigationVM.navigateToPreviousFTUXRoute(FTUX_Routes.AddRelationships)}>
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
                        <Text h2>Who is in your circle?</Text>
                    </View>
                    <View left marginT-20>
                        <Text labelRegular>Sharing information about relationships helps personalize your advice.</Text>
                    </View>

                    <View flex>
                        <Memo>
                            {() => viewModel.relationshipDetails$.get().map((_, index) => (
                                <RelationshipDetailsItem

                                    key={index}
                                    relationshipType$={viewModel.relationshipDetails$[index].relationshipType}
                                    name$={viewModel.relationshipDetails$[index].name}
                                    index={index}
                                    onRemove={(index) => viewModel.removeRelationship(index)}
                                />
                            ))}
                        </Memo>

                        <TouchableOpacity
                            center marginT-20
                            style={styles.addButton}
                            onPress={handleAddPerson}
                        >
                            <Text style={styles.addButtonText}>
                                {viewModel.relationshipDetails$.peek().length === 0 ? 'Add person' : 'Add another person'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
                {!navigationVM.getIsMyData() && (
                    <View style={FTUX.bottomContainer}>
                        <TouchableOpacity
                            style={[styles.continueButton, !continueEnabled && styles.disabledButton]}
                            onPress={handleContinue}
                            disabled={!continueEnabled}>
                            <Text style={styles.continueButtonText}>Continue</Text>
                            <Ionicons name="arrow-forward" size={20} color="#FFF" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => handleSkip()}
                            style={{ cursor: 'pointer' }}>
                            <Text labelSecondary underline>
                                Skip for now
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
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
    continueButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '500',
    },
    disabledButton: {
        opacity: 0.5,
    },
});

export default AddRelationshipsScreen; 
