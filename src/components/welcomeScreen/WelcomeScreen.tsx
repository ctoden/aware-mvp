import * as React from "react";
import {StyleSheet, useWindowDimensions, View, Platform, ScrollView} from "react-native";
import {WelcomeHeader} from "./WelcomeHeader";
import {ActionButton} from "./ActionButton";
import {AwareBall} from "@app/components/AwareBall";
import {useRouter} from "expo-router";
import { UserProfileViewModel } from "@src/viewModels/UserProfileViewModel";
import { useViewModel } from "@src/hooks/useViewModel";
import { useObservable } from "@legendapp/state/react";
import { observer } from "@legendapp/state/react";
import { NavigationViewModel } from "@src/viewModels/NavigationViewModel";
import { LoadingOverlay } from "@src/components/LoadingOverlay";
import { isEmpty } from "lodash";

export const WelcomeScreen: React.FC = observer(() => {
    const { height, width } = useWindowDimensions();
    const navigator = useRouter();

    const { viewModel: navigationVM } = useViewModel(NavigationViewModel);
    const { viewModel } = useViewModel(UserProfileViewModel);
    
    // Get profile data directly for reactivity
    const profile = useObservable(viewModel.userProfile$);
    
    // Check if profile is loading - we'll show a loading overlay if needed
    const isProfileLoading = viewModel.isLoading$.get();
    
    const handleAddAssessment = () => {
        console.log("~~~ Add assessment button pressed");
        navigator.navigate("ChooseAssessment");
    };

    // Use viewModel.firstName for a consistent way to get the first name
    // This should use formState while profile loads
    const firstName = viewModel.firstName;

    return (
        <View style={styles.screenContainer}>
            {isProfileLoading && (
                <LoadingOverlay 
                    visible={isProfileLoading}
                    message="Setting up your profile..."
                />
            )}
            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <WelcomeHeader
                    userName={firstName}
                    emoji="🎉"
                    message="If you've taken any personality tests before, you can go ahead and add those results now. This will help tailor your experience with Aware and provide you with personalized insights."
                />
            </ScrollView>
            
            <View style={styles.buttonContainer}>
                <ActionButton
                    label="Add an assessment"
                    onPress={handleAddAssessment}
                />
            </View>

            <View style={[styles.awareBall, { top: height - (600 / 2) }]}>
                <AwareBall step={2} />
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    screenContainer: {
        flex: 1,
        width: "100%",
        height: "100%",
        overflow: "hidden",
    },
    scrollContent: {
        flexGrow: 1,
        padding: 16,
        paddingBottom: Platform.OS === 'ios' ? 120 : 100, // Extra padding to prevent content from being hidden behind the button
        alignItems: "center",
    },
    buttonContainer: {
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10, // Ensure button is above other elements including the ball
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 40 : 30,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
    },
    awareBall: {
        position: "absolute",
        top: 0,
        left: 0,
        zIndex: -1,
        width: "100%",
        height: "100%",
    }
});

export default WelcomeScreen;