import themeObject from '@app/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { observer, useObservable } from '@legendapp/state/react';
import { AssessmentsTaken } from '@src/components/assessments/overview/AssessmentsTaken';
import { CoreValuesList } from "@src/components/coreValues/CoreValuesList";
import ShareButton from '@src/components/icons/ShareButton';
import { LoadingOverlay } from '@src/components/LoadingOverlay';
import MotivationsSimpleList from '@src/components/motivations/MotivationsSimpleList';
import { ProfessionalDevelopmentProfile } from '@src/components/professionalDevelopment/ProfessionalDevelopmentProfile';
import { ReactiveButton } from '@src/components/ReactiveButton';
import { ReactiveText } from '@src/components/ReactiveText';
import { RelationshipProfile } from '@src/components/relationships/RelationshipProfile';
import SecondaryButton from '@src/components/secondaryButton/SecondaryButton';
import { TopQualitiesList } from "@src/components/topQualities/TopQualityList";
import { WeaknessesList } from '@src/components/weaknesses/WeaknessesList';
import { useViewModel } from '@src/hooks/useViewModel';
import { LocalStorageService } from '@src/services/LocalStorageService';
import { showSuccessToast } from '@src/utils/ToastUtils';
import { NavigationViewModel } from "@src/viewModels/NavigationViewModel";
import { UserProfileViewModel } from '@src/viewModels/UserProfileViewModel';
import { useRouter } from "expo-router";
import React, { FC, useEffect } from 'react';
import { ScrollView } from 'react-native';
import Toast from 'react-native-toast-message';
import { Image, Text, View } from 'react-native-ui-lib';
import { RadialQualityGradientView } from '@src/components/topQualities/RadialQualityGradientView';
import PrimaryButton from '@src/components/primaryButton/PrimaryButton';
import PencilIcon from '@src/components/icons/PencilIcon';
import { ButtonRegular } from '@src/components/text/ButtonRegular';

export const UserProfileScreen: FC = observer(() => {
    const { viewModel: userProfileViewModel, isInitialized, error } = useViewModel(UserProfileViewModel);
    const { viewModel: navigationViewModel } = useViewModel(NavigationViewModel);
    const localStorageService = LocalStorageService.getInstance();

    const router = useRouter();

    const userProfile = useObservable(userProfileViewModel.userProfile$);
    const fullName$ = useObservable("");
    const summary$ = useObservable("");
    const phoneNumber$ = useObservable("");
    const avatarUrl$ = useObservable("");
    const isRefreshing$ = useObservable(false);
    const isLoginActionsInProgress$ = useObservable(userProfileViewModel.isLoginActionsInProgress$);
    const isProfileDataLoading$ = useObservable(userProfileViewModel.isProfileDataLoading$);

    const handleMyDataPress = () => {
        console.log("~~~~ UserProfileScreen My Data");
        navigationViewModel.setIsMyData(true);
        navigationViewModel.navigateToMyData();
    };

    const checkAndRefreshProfile = async () => {
        // We'll now use the UserProfileService to handle this logic
        isRefreshing$.set(true);
        try {
            const result = await userProfileViewModel.checkProfileRefresh();
            if (result.isErr()) {
                console.error('Error refreshing profile:', result.error);
            } else if (result.value) {
                // If refresh occurred, show toast
                showSuccessToast('Updating user profile');

                // Give services some time to process
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        } catch (error) {
            console.error('Unexpected error during profile refresh:', error);
        } finally {
            isRefreshing$.set(false);
        }
    };

    // Effect to wait for all profile-related actions to complete when the component initializes
    useEffect(() => {
        if (!isInitialized) {
            return;
        }

        // Check if login or profile actions are in progress and wait for them to complete
        const checkProfileActions = async () => {
            try {
                await userProfileViewModel.waitForProfileActionsToComplete();
            } catch (error) {
                console.error('Error waiting for profile actions:', error);
            }
        };

        checkProfileActions();
    }, [isInitialized]);

    useEffect(() => {
        if (!isInitialized) {
            return;
        }

        console.log("~~~~ UserProfileScreen userProfile", userProfile.get());

        fullName$.set(userProfile.get()?.full_name ?? '');
        summary$.set(userProfile.get()?.summary ?? '');
        phoneNumber$.set(userProfile.get()?.phone_number ?? '');
        avatarUrl$.set(userProfile.get()?.avatar_url ?? '');

        const unsubscribes: { (): void; }[] = [];

        unsubscribes.push(userProfile.onChange((profile) => {
            console.log("~~~~ UserProfileScreen userProfile.onChange", profile);
            fullName$.set(profile?.value?.full_name ?? '');
            summary$.set(profile?.value?.summary ?? '');
            phoneNumber$.set(profile?.value?.phone_number ?? '');
            avatarUrl$.set(profile?.value?.avatar_url ?? '');
        }));

        if (userProfileViewModel.userProfile$.get()) {
            unsubscribes.push(userProfileViewModel.userProfile$.summary.onChange(() => {
                summary$.set(userProfileViewModel?.userProfile$.get()?.summary ?? '');
            }));
            unsubscribes.push(userProfileViewModel.userProfile$.full_name.onChange(() => {
                fullName$.set(userProfileViewModel?.userProfile$.get()?.full_name ?? '');
            }));

            unsubscribes.push(userProfileViewModel.userProfile$.phone_number.onChange(() => {
                phoneNumber$.set(userProfileViewModel?.userProfile$.get()?.phone_number ?? '');
            }));

            unsubscribes.push(userProfileViewModel.userProfile$.avatar_url.onChange(() => {
                avatarUrl$.set(userProfileViewModel?.userProfile$.get()?.avatar_url ?? '');
            }));
        }

        // Only check for refresh if FTUX is completed
        checkAndRefreshProfile();

        return () => {
            unsubscribes.forEach(unsubscribe => unsubscribe());
        };
    }, [isInitialized]);

    if (!isInitialized) {
        return <Text>Loading...</Text>;
    }

    if (error) {
        return <Text>Error: {error.message}</Text>;
    }

    const isLoading = isRefreshing$.get() || isLoginActionsInProgress$.get() || isProfileDataLoading$.get();
    const loadingMessage = isLoginActionsInProgress$.get()
        ? "Setting up your profile..."
        : isProfileDataLoading$.get()
            ? "Loading your profile data..."
            : "Updating your profile...";

    return (
        <View flex style={{ backgroundColor: themeObject.colors.background }}>
            <LoadingOverlay
                visible={isLoading}
                message={loadingMessage}
            />
            <ScrollView
                contentContainerStyle={{ padding: 16 }}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={true}
            >
                <View style={{ width: '100%' }}>
                    <View row spread centerV>
                        <View flex />
                        <View marginT-24 left width={125}>
                            <PrimaryButton onPress={handleMyDataPress}>
                                <View row>
                                    <PencilIcon style={{ width: 20, height: 20, marginRight: 8 }} color="#ffffff" />
                                    <ButtonRegular color='#ffffff'>My Data</ButtonRegular>
                                </View>
                            </PrimaryButton>
                        </View>
                    </View>

                    <View left marginT-10>
                        <View
                            style={{
                                width: 120,
                                height: 120,
                                borderRadius: 60,
                                overflow: 'hidden',
                            }}
                        >
                            <RadialQualityGradientView
                                size={120}
                                showLegend={false}
                            />
                        </View>
                    </View>

                    <View marginT-10 style={{ maxWidth: '100%', width: '100%' }}>
                        <ReactiveText h1 text$={fullName$} />
                    </View>

                    <View marginT-40 style={{ width: '100%' }}>
                        <Text h2>Summary</Text>
                        <ReactiveText
                            bodyRegular
                            text$={summary$}
                        />
                    </View>

                    <View marginT-24 left width={125}>
                        <SecondaryButton
                            onPress={() => {
                                console.log("~~~~ UserProfileScreen Edit Profile");
                                Toast.show({
                                    type: 'info',
                                    text1: 'Coming Soon',
                                    text2: 'Sharing is not implemented yet',
                                    position: 'bottom',
                                    visibilityTime: 2000,
                                });
                            }}
                        >
                            <View row>
                                <ShareButton />
                                <Text marginL-8 buttonRegular>Share</Text>
                            </View>
                        </SecondaryButton>
                    </View>

                    <View style={{ width: '100%' }}>
                        <View marginT-56 style={{ width: '100%' }}>
                            <AssessmentsTaken />
                        </View>
                        <View marginT-56 style={{ width: '100%' }}>
                            <TopQualitiesList />
                        </View>
                        <View marginT-56 style={{ width: '100%' }}>
                            <CoreValuesList />
                        </View>
                        <View marginT-56 style={{ width: '100%' }}>
                            <RelationshipProfile />
                        </View>
                        <View marginT-56 style={{ width: '100%' }}>
                            <ProfessionalDevelopmentProfile />
                        </View>
                        <View marginT-56 style={{ width: '100%' }}>
                            <MotivationsSimpleList />
                        </View>
                        <View marginT-56 style={{ width: '100%' }}>
                            <WeaknessesList />
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
});

export default UserProfileScreen;