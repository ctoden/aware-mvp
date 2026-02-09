import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import dayjs from 'dayjs';

// Third Party Libraries
import { Ionicons } from "@expo/vector-icons";
import { useObservable } from '@legendapp/state/react';
import { useRouter } from 'expo-router';

// Components
import { H1 } from '@src/components/text/H1';
import { ButtonRegular } from '@src/components/text/ButtonRegular';
import { ProfileCard } from '@src/components/profileCard/ProfileCard';
import { DataSection } from '@src/components/myData/DataSection';
import BackArrow from "@src/components/icons/BackArrow";
import TextButton from '@app/components/TextButton';
import { BottomContainer } from '@src/components/myData/BottomContainer';
import { ConfirmationModal, ConfirmationData } from '@src/components/myData/ConfirmationModal';

// Utils and Services
import { showErrorToast } from '@src/utils/ToastUtils';
import { DependencyService } from '@src/core/injection/DependencyService';
import { LocalStorageService } from '@src/services/LocalStorageService';

// Models and State
import {
    session$,
    user$,
    isAuthenticated$,
} from '@src/models/SessionModel';
import { familyStory$ } from '@src/models/FamilyStoryModel';
import { careerHistory$ } from '@src/models/CareerHistoryModel';
import { userAboutYou$ } from '@src/models/UserAboutYou';
import { userAssessments$ } from '@src/models/UserAssessment';
import { userProfile$ } from '@src/models/UserProfile';
import { FTUX_Routes } from '@src/models/NavigationModel';
import { userInterests$ } from '@src/models/UserInterests';
import { userGoals$ } from '@src/models/UserGoals';
import { userRelationships$ } from '@src/models/UserRelationship';

// Core
import { emitChange, ChangeType } from '@src/events/ChangeEvent';

// ViewModels
import { UserProfileViewModel } from '@src/viewModels/UserProfileViewModel';
import { NavigationViewModel } from '@src/viewModels/NavigationViewModel';
import { AssessmentViewModel } from '@src/viewModels/AssessmentViewModel';

// Constants and Theme
import { customColors } from '@app/constants/theme';

// Types
import { AssessmentData, PersonalData, DemographicData, CareerData } from '@src/components/myData/types';
import { useViewModel } from '@src/hooks/useViewModel';

export const MyDataScreen: React.FC = () => {

    const { viewModel: userProfileViewModel, isInitialized, error } = useViewModel(UserProfileViewModel);
    const { viewModel: navigationViewModel } = useViewModel(NavigationViewModel);
    const { viewModel: assessmentViewModel } = useViewModel(AssessmentViewModel);
    const [modalOpened, setModalOpened] = useState(false);
    const [currentModalData, setModalData] = useState<ConfirmationData>({
        title: 'Are you sure?',
        message: 'This action cannot be undone.',
        primaryButtonText: 'Delete',
        secondaryButtonText: 'Close',
        primaryAction: () => { },
        secondaryAction: () => { }
    });
    const router = useRouter();

    const userProfile = useObservable(userProfileViewModel.userProfile$);
    const fullName$ = useObservable("");
    const email$ = useObservable("");
    const summary$ = useObservable("");
    const phoneNumber$ = useObservable("");
    const avatarUrl$ = useObservable("");
    const assessments = useObservable(userAssessments$);
    const goals = useObservable(userGoals$);
    const interests = useObservable(userInterests$);
    const careerHistory = useObservable(careerHistory$);

    // Add loading state
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initializeProfile = async () => {
            if (!isInitialized) return;

            setIsLoading(true);
            try {
                // Ensure profile is fetched
                await userProfileViewModel.checkProfileRefresh();

                // Update local observables
                fullName$.set(userProfile.get()?.full_name ?? '');
                email$.set(userProfileViewModel.email ?? '');

                // Set up subscriptions
                const unsubscribe = userProfile.onChange((profile) => {
                    fullName$.set(profile?.value?.full_name ?? '');
                    email$.set(userProfileViewModel.email ?? '');
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

    const assessmentData: AssessmentData[] = assessments.get().map(assessment => {
        // Extract assessment type and summary from the database record
        const type = assessment.assessment_type;
        const summary = assessment.assessment_summary;

        // Map assessment types to display titles and routes
        const titleMap: Record<string, string> = {
            'MBTI': 'Myers Briggs (MBTI®)',
            'CliftonStrengths': 'CliftonStrengths®',
            'Enneagram': 'Enneagram',
            'DISC': 'DISC',
            'MotivationCode': 'Motivation Code',
            'LoveLanguages': 'Love Languages'
        };

        return {
            title: titleMap[type] || type,
            value: summary || 'No result',
            route: 'AssessmentDetail',
            id: assessment.id, // Store the assessment ID
            onPress: (item) => {
                // Set the current assessment ID before navigating
                assessmentViewModel.setCurrentAssessment(assessment.id);
                // Set flag to indicate we're coming from MyData screen
                navigationViewModel.setIsMyData(true);
                // The navigation will happen in the DataItem component
            }
        };
    });

    const personalData: PersonalData[] = [
        {
            title: 'Goals',
            value: goals.get()?.summary || 'Add',
            route: 'UltimateGoals'
        },
        {
            title: 'Interests',
            value: interests.get()?.summary || 'Add',
            route: 'MainInterests',
        }
    ];

    const demographicData: DemographicData[] = [
        {
            title: 'Age',
            value: userProfile.get()?.birth_date 
                ? dayjs().diff(dayjs(userProfile.get()?.birth_date), 'years').toString()
                : 'Add',
            route: 'BirthDate'
        },
        {
            title: 'Circle',
            value: userRelationships$.peek() ? Object.values(userRelationships$.peek() ?? {}).map(r => r.communication_style_title ?? '').filter(Boolean).join(', ') : 'Add',
            route: 'AddRelationships'
        },
        {
            title: 'Family story',
            value: userProfile.get()?.family_story || 'Add',
            route: 'AddFamilyStory'
        },
        {
            title: 'Education',
            value: 'Add',
            route: 'Education'
        }
    ];

    const careerData: CareerData[] = [
        {
            title: 'Occupation',
            value: careerHistory.get().length > 0
                ? careerHistory.get()[0].position_text
                : 'Add',
            route: 'PrimaryOccupation'
        },
        {
            title: 'Career journey',
            value: careerHistory.get().length > 1
                ? `${careerHistory.get().length - 1} entries`
                : 'Add',
            route: 'CareerJourney'
        }
    ];

    const handleDeleteAccount = () => {
        console.log("~ CONFIRM DELETE ACCOUNT ~");
        showErrorToast("Not Implemented", "Delete account feature is not implemented yet");
        handleCloseConfirmation();
    }

    const handleLogout = async () => {
        console.log("~~~ Initiating logout from MyDataScreen");
        try {
            const result = await navigationViewModel.logout();
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

    const handleToggleConfirmation = (modalData: ConfirmationData) => {
        setModalData(modalData);
        setModalOpened(true);
    }

    const handleCloseConfirmation = () => {
        setModalOpened(false);
    }

    const handleBack = () => {
        navigationViewModel.navigateToIndex();
    }

    const handleAddAssessment = () => {
        router.push('/AddAssessment');
    };

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
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={true}
            >
                <View style={styles.container}>
                    <View style={styles.logoContainer}>
                        <TouchableOpacity onPress={handleBack}>
                            <BackArrow />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.contentContainer}>
                        <H1 noMargins noPadding shadow>My Data</H1>
                        <ProfileCard name={fullName$.get()} email={email$.get()} avatar={avatarUrl$.get()} />
                        <DataSection title="Assessments" data={assessmentData} />
                        <TouchableOpacity style={styles.addButton} onPress={handleAddAssessment}>
                            <Ionicons name={"add"} size={12} color={"white"} />
                            <ButtonRegular color={customColors.white}>Add an assessment</ButtonRegular>
                        </TouchableOpacity>

                        <DataSection title="Personal data" data={personalData} />
                        <DataSection title="Demographic data" data={demographicData} />
                        <DataSection title="Career data" data={careerData} />

                        <BottomContainer
                            marginTop={48}
                            marginBottom={48}>
                            <TextButton
                                justifyContent='flex-start'
                                text='Logout'
                                onPress={() => handleToggleConfirmation(modalOptions.logout)} />

                            <TextButton
                                justifyContent='flex-start'
                                text='Delete Account'
                                onPress={() => handleToggleConfirmation(modalOptions.deleteAccount)} />
                        </BottomContainer>
                    </View>
                    <ConfirmationModal
                        modalData={currentModalData}
                        confirmationOpen={modalOpened} />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        flex: 1,
        backgroundColor: customColors.beige1,
        width: '100%',
        maxWidth: '100%',
    },
    scrollContainer: {
        flexGrow: 1,
        width: '100%',
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
        paddingHorizontal: 16,
        gap: Platform.OS === 'ios' ? 8 : 16,
        flexDirection: 'column',
        alignItems: 'stretch',
        maxWidth: '100%',
        paddingBottom: Platform.OS === 'ios' ? 10 : 0,
    },
    addButton: {
        borderRadius: 50,
        marginTop: 8,
        minHeight: 56,
        paddingHorizontal: 24,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        backgroundColor: customColors.black1,
    },

});
