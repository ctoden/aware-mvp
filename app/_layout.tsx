import React, {useEffect, useState} from 'react';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import {SafeAreaProvider} from "react-native-safe-area-context";
import {DependencyService} from '@src/core/injection/DependencyService';
import {AppInitializationService} from '@src/services/AppInitializationService';
import Toast from 'react-native-toast-message';
import AppHome from "@app/index";
import {err, Result} from "neverthrow";
import {Text, View, StyleSheet, useColorScheme} from "react-native";
import { useFonts } from 'expo-font';
import { enableScreens } from 'react-native-screens';
import 'react-native-gesture-handler';
import { initializeSupabaseClient } from '@src/utils/SupabaseClientUtil';

enableScreens();

export default function RootLayout() {
    const [initialized, setInitialized] = useState(false);
    const [initError, setInitError] = useState<Error | null>(null);
    const colorScheme = useColorScheme();

    const [loaded, error] = useFonts({
        SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
        JosefinSlab: require('../assets/fonts/JosefinSlab-VariableFont_wght.ttf'),
        Inter: require('../assets/fonts/Inter-VariableFont_slnt,wght.ttf'),
        WorkSansBold: require('../assets/fonts/WorkSans-Bold.ttf'),
        WorkSansExtraBold: require('../assets/fonts/WorkSans-ExtraBold.ttf'),
        WorkSans: require('../assets/fonts/WorkSans-Regular.ttf'),
        WorkSansBlack: require('../assets/fonts/WorkSans-Black.ttf'),
        WorkSansSemiBold: require('../assets/fonts/WorkSans-SemiBold.ttf'),
        PoetsenOne: require('../assets/fonts/PoetsenOne-Regular.ttf'),
      });

    useEffect(() => {
        const initializeApp = async (): Promise<Result<boolean, Error>> => {
            try {
                // Explicitly initialize Supabase first
                const clientResult = await initializeSupabaseClient();
                if (clientResult.isErr()) {
                    console.error('Supabase client initialization failed:', clientResult.error);
                    return err(clientResult.error);
                }
                
                // Then initialize the app
                const appInitService = DependencyService.resolve(AppInitializationService);
                const result = await appInitService.initialize();
                
                if (result.isErr()) {
                    console.error('App initialization failed:', result.error);
                }
                return result;
            } catch (error) {
                console.error('Unexpected error during app initialization:', error);
                return err(error instanceof Error ? error : new Error('Unexpected error during app initialization'));
            }
        };

        initializeApp().then((result) => {
            if(result.isErr()) {
                setInitError(result.error);
                Toast.show({
                    type: 'error',
                    text1: 'Error!',
                    text2: 'Application initialization failed: ' + result.error.message,
                    position: 'bottom',
                    visibilityTime: 10000,
                });
            }
            setInitialized(result.isOk());
        });

        return () => {
            const appInitService = DependencyService.resolve(AppInitializationService);
            void appInitService.end();
        };
    }, []);

    if (initError) {
        return (
            <SafeAreaProvider>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Failed to initialize app: {initError.message}</Text>
                    <Text style={styles.errorHint}>Please restart the application</Text>
                </View>
            </SafeAreaProvider>
        );
    }

    return (
        <SafeAreaProvider>
            <ThemeProvider value={colorScheme === 'dark' ? DefaultTheme : DefaultTheme}>
                {(!initialized || !loaded) && <Text style={styles.loading}>Loading...</Text>}
                {initialized && loaded && <AppHome />}
                <Toast />
            </ThemeProvider>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        color: 'red',
        fontSize: 16,
        marginBottom: 10,
        textAlign: 'center',
    },
    errorHint: {
        fontSize: 14,
        marginTop: 10,
        textAlign: 'center',
    },
    loading: {
        marginTop: 8,
        textAlign: 'center',
    }
});