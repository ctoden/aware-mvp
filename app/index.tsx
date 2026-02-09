import React, {useEffect} from 'react';
import {Stack, useRouter} from 'expo-router';
import {useViewModel} from '@src/hooks/useViewModel';
import {observer, useIsMounted} from "@legendapp/state/react";
import {ActivityIndicator, StyleSheet, Text, useWindowDimensions} from "react-native";
import {NavigationViewModel} from "@src/viewModels/NavigationViewModel";
import {SafeAreaView} from "react-native-safe-area-context";
import { FTUX_Routes } from '@src/models/NavigationModel';

export const AppHome = observer(() => {
    const {width} = useWindowDimensions();
    const router = useRouter();
    const isMounted = useIsMounted();

    const {
        viewModel: navigationVM,
        isInitialized: navInitialized,
        error: navError
    } = useViewModel<NavigationViewModel>(NavigationViewModel);

    // navigate based on navigationVM
    useEffect(() => {
        if (isMounted.get() && navInitialized) {
            console.log(`[NAV-DEBUG] AppHome useEffect - Screen width: ${width}`);
            navigationVM.updateScreenSize(width);

            // Get the base route (e.g., "Chat", "Intro", "Auth")
            const baseRoute = navigationVM.currentRoute$.get();

            // Get the full route path, which will:
            // 1. For ScreenRoutes (Chat, Explore, Profile, etc.): Add the layout prefix based on screen size
            // 2. For other routes (FTUX, Auth): Keep the route as is without a layout prefix
            const fullRoute = navigationVM.getRouteFor(baseRoute);

            console.log(`[NAV-DEBUG] AppHome useEffect - Base route: ${baseRoute}`);
            console.log(`[NAV-DEBUG] AppHome useEffect - Full route: ${fullRoute}`);
            console.log(`[NAV-DEBUG] AppHome useEffect - Navigating to: ${fullRoute}`);

            router.replace(fullRoute);
        }
    }, [width, router, navInitialized, navigationVM.currentRoute$.get()]);

    if (navError) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={styles.error}>
                    {navError?.message}
                </Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            { !navInitialized && <ActivityIndicator size="large" /> }
            { !navInitialized && <Text style={styles.loading}>Loading...</Text> }
            <Stack screenOptions={{headerShown: false}}>
                <Stack.Screen name="(tabs)" options={{headerShown: false}}/>
                <Stack.Screen name="(navbar)" options={{headerShown: false}}/>
                <Stack.Screen name="SignUp" options={{headerShown: false}}/>
                <Stack.Screen name="SignIn" options={{headerShown: false}}/>
                <Stack.Screen name={FTUX_Routes.Intro} options={{headerShown: false}}/>
                <Stack.Screen name={FTUX_Routes.Auth} options={{headerShown: false}}/>
                <Stack.Screen name={FTUX_Routes.Welcome} options={{headerShown: false}}/>
                <Stack.Screen name={FTUX_Routes.BirthDate} options={{headerShown: false}}/>
                <Stack.Screen name={FTUX_Routes.MainInterests} options={{headerShown: false}}/>
                <Stack.Screen name={FTUX_Routes.AlmostDone} options={{headerShown: false}}/>
                <Stack.Screen name={FTUX_Routes.UltimateGoals} options={{headerShown: false}}/>
                <Stack.Screen name={FTUX_Routes.ShortTermGoals} options={{headerShown: false}}/>
                <Stack.Screen name={FTUX_Routes.AddRelationships} options={{headerShown: false}}/>
                <Stack.Screen name={FTUX_Routes.AddFamilyStory} options={{headerShown: false}}/>
                <Stack.Screen name={FTUX_Routes.PrimaryOccupation} options={{headerShown: false}}/>
                <Stack.Screen name={FTUX_Routes.CareerJourney} options={{headerShown: false}}/>
                <Stack.Screen name={FTUX_Routes.AddAvatar} options={{headerShown: false}}/>
                <Stack.Screen name={FTUX_Routes.IntroducingYou} options={{headerShown: false}}/>
                <Stack.Screen name={FTUX_Routes.ChooseAssessment} options={{headerShown: false}}/>
                <Stack.Screen name={FTUX_Routes.MBTI} options={{ headerShown: false }} />
                <Stack.Screen name={FTUX_Routes.AssessmentDetails} options={{ headerShown: false }} />
            </Stack>
        </SafeAreaView>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    safeArea: {
        flex: 1,
    },
    error: {
        color: 'red',
        marginTop: 8,
        textAlign: 'center',
    },
    loading: {
        marginTop: 8,
        textAlign: 'center',
    },
});

export default AppHome;