import React, { FC, useCallback } from 'react';
import { StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Colors, Text, TouchableOpacity, View } from 'react-native-ui-lib';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { customColors } from '@app/constants/theme';
import { observer } from '@legendapp/state/react';
import { FTUX_Routes } from '@src/models/NavigationModel';
import { useViewModel } from '@src/hooks/useViewModel';
import { NavigationViewModel } from '@src/viewModels/NavigationViewModel';
import typography from 'react-native-ui-lib/src/style/typography';

export const EducationScreen: FC = observer(() => {
    const { viewModel: navigationVM } = useViewModel(NavigationViewModel);

    const handleDone = useCallback(async () => {
        router.push(navigationVM.getRouteFor(FTUX_Routes.IntroducingYou));
    }, [navigationVM]);

    const handleContinue = useCallback(async () => {
        router.push(navigationVM.getRouteFor(FTUX_Routes.PrimaryOccupation));
    }, [navigationVM]);

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
                                    <TouchableOpacity onPress={() => navigationVM.navigateToPreviousFTUXRoute(FTUX_Routes.Education)}>
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
                                <TouchableOpacity onPress={() => navigationVM.navigateToMyData()}>
                                    <Text style={[typography.bodyLBold]}>
                                        Done
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )
                    }
                    <View left marginT-20>
                        <Text h2>What's your education background?</Text>
                    </View>
                    <View left marginT-20>
                        <Text labelRegular>Share your educational journey to help personalize your experience.</Text>
                    </View>
                    
                    <View flex>
                        <View style={styles.placeholderContainer}>
                            <Text style={styles.placeholderText}>Education form coming soon...</Text>
                        </View>
                    </View>

                    {!navigationVM.getIsMyData() && (
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
                    )}
                </View>
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
    placeholderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 40,
        padding: 20,
        backgroundColor: customColors.beige2,
        borderRadius: 8,
    },
    placeholderText: {
        ...typography.bodyM,
        color: customColors.gray2,
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
});

export default EducationScreen;