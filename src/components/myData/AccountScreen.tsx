import React, { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { View, Text, Colors } from 'react-native-ui-lib';
import { H1 } from '../text/H1';
import { customColors } from '@app/constants/theme';
import { useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
// import BackArrow from '@src/components/icons/BackArrow';
import { useViewModel } from '@src/hooks/useViewModel';
import { NavigationViewModel } from '@src/viewModels/NavigationViewModel';
import { FTUX_Routes } from '@src/models/NavigationModel';
import typography from 'react-native-ui-lib/src/style/typography';
import { H2 } from '../text/H2';
import { AvatarWithGradient } from '../profileCard/AvatarWithGradient';
import ProfileImage from '../profileCard/ProfileImage';
import { Label } from '../text/Label';
import avatar from 'react-native-ui-lib/src/components/avatar';
import ProfileImageContainer from '../profileCard/ProfileImageContainer';
import { useObservable } from '@legendapp/state/react';
import { UserProfileViewModel } from '@src/viewModels/UserProfileViewModel';
import { InputField } from '../auth/signUp/InputField';
import { ButtonRegular } from '../text/ButtonRegular';
import { assessmentStyles } from '../text/types';
import TextButton from '@app/components/TextButton';
import { BottomContainer } from './BottomContainer';
import { DependencyService } from '@src/core/injection/DependencyService';
import { emitChange, ChangeType } from '@src/events/ChangeEvent';
import { LocalStorageService } from '@src/services/LocalStorageService';
import { showErrorToast } from '@src/utils/ToastUtils';

export const AccountScreen: React.FC = () => {
    const router = useRouter();
    const { viewModel: userProfileViewModel, isInitialized, error } = useViewModel(UserProfileViewModel);
    const { viewModel: navigationVM } = useViewModel(NavigationViewModel);
    const [modalOpened, setModalOpened] = useState(false);
    const userProfile = useObservable(userProfileViewModel.userProfile$);
    const fullName$ = useObservable("");
    const email$ = useObservable("");
    const phone$ = useObservable("");
    const avatarUrl$ = useObservable(userProfile.avatar_url ?? '');

    const [isLoading, setIsLoading] = useState(true);
    const handleLogout = async () => {
        console.log("~~~ Initiating logout from AccountScreen");
        try {
            const result = await navigationVM.logout();
            if (result.isErr()) {
                throw new Error(result.error.message);
            }
        } catch (error) {
            console.error('~~~ Error during logout:', error);
            showErrorToast("Logout Failed", error instanceof Error ? error.message : "An unexpected error occurred");
        } finally {
            handleCloseConfirmation();
        }
    };

    useEffect(() => {
        const initializeProfile = async () => {
            if (!isInitialized) return;

            setIsLoading(true);
            try {
                // Ensure profile is fetched
                await userProfileViewModel.checkProfileRefresh();

                // Update local observables
                fullName$.set(userProfileViewModel.firstName ?? '');
                email$.set(userProfileViewModel.email ?? '');
                phone$.set(userProfileViewModel.phoneNumber ?? '');

                // Set up subscriptions
                const unsubscribe = userProfile.onChange((profile) => {
                    fullName$.set(userProfileViewModel.firstName ?? '');
                    email$.set(userProfileViewModel.email ?? '');
                    phone$.set(userProfileViewModel.phoneNumber ?? '');

                });

                return () => unsubscribe();
            } catch (error) {
                console.error('Error initializing profile:', error);
            } finally {
                setIsLoading(false);
            }
        };

        initializeProfile();
    }, [isInitialized, userProfile]);

    if (!isInitialized || isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" />
                <Text>Loading profile...</Text>
            </View>
        );
    }

    if (error) {
        return <Text>Error: {error.message}</Text>;
    }

    const handleBack = () => {
        router.back();
    };

    const handleDone = () => {
        // handle done
    }

    const handleSubmit = () => {
        // handle submit
    }

    const handleSignOut = () => {
        // handle sign out
    };

    const handleResetPassword = () => {
        //handle reset
    };

    const handleAddPhone = () => {
        //handle add phone
    };

    const handleDeleteAccount = () => {
        console.log("~ CONFIRM DELETE ACCOUNT ~");
        showErrorToast("Not Implemented", "Delete account feature is not implemented yet");
        handleCloseConfirmation();
    }

    const handleCloseConfirmation = () => {
        setModalOpened(false);
    }

    const modalOptions = {
        deleteAccount: {
            title: 'Are you sure?',
            message: 'Deleting your account is permanent.',
            primaryButtonText: "Delete",
            secondaryButtonText: "Close",
            primaryAction: handleDeleteAccount,
            secondaryAction: handleCloseConfirmation
        },
        logout: {
            title: 'Are you sure?',
            message: 'Logging out will end your session.',
            primaryButtonText: "Logout",
            secondaryButtonText: "Close",
            primaryAction: handleLogout,
            secondaryAction: handleCloseConfirmation
        }
    }

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
                    }
                    <View style={styles.contentContainer}>
                        <H2 noMargins noPadding>Account</H2>
                    </View>
                    <ProfileImage>
                        <Label>Profile Image</Label>
                        <ProfileImageContainer>
                            <AvatarWithGradient avatar={avatarUrl$.get() || undefined} />
                        </ProfileImageContainer>
                    </ProfileImage>
                    <View style={styles.form}>
                        <InputField
                            label="Name"
                            value={fullName$}
                            id="name"
                            testID="account-name"
                        />
                        <InputField
                            label="Email"
                            value={email$}
                            id="email"
                            testID="account-email"
                        />
                        <InputField
                            label="Phone"
                            value={phone$}
                            id="phone"
                            testID="account-phone"
                        />
                    </View>

                    <View style={[assessmentStyles.myDataButtonsContainer, styles.bottomButtonsContainer]}>
                        <TouchableOpacity
                            style={assessmentStyles.submitButton}
                            onPress={handleLogout}>
                            <ButtonRegular color={customColors.white}>Sign out</ButtonRegular>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={assessmentStyles.resetButton}
                            onPress={() => { }}>
                            <ButtonRegular color={customColors.black1}>Reset Password</ButtonRegular>
                        </TouchableOpacity>
                    </View>
                    <BottomContainer
                        marginTop={48}
                        marginBottom={48}>
                        <TextButton
                            justifyContent='flex-start'
                            text='Delete Account'
                            onPress={handleDeleteAccount} />
                    </BottomContainer>
                </View>
            </ScrollView>
        </KeyboardAvoidingView> 
    );
};

const styles = StyleSheet.create({
    bottomButtonsContainer: {
        marginTop: 64,  
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    form: {
        marginTop: 32,
    },
    container: {
        flex: 1,
        backgroundColor: customColors.beige1,
    },
    scrollContainer: {
        flexGrow: 1,
        minHeight: '100%',
    },
    logoContainer: {
        zIndex: 10,
        display: 'flex',
        marginTop: 20,
        width: 60,
        height: 60,
        padding: 16,
    },
    contentContainer: {
        display: 'flex',
        width: '100%',
        flexDirection: 'column',
        alignItems: 'stretch',
        marginBottom: 36
    }
});


