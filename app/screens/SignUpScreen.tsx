import React, {useCallback, useState} from 'react';
import {ActivityIndicator, StyleSheet} from 'react-native';
import {Colors, Text, View} from 'react-native-ui-lib';
import {SignUpViewModel} from '@src/viewModels/SignUpViewModel';
import {useViewModel} from '@src/hooks/useViewModel';
import {useRouter} from 'expo-router';
import {isValidEmail} from '@src/utils/EmailUtils';
import {observer} from "@legendapp/state/react";
import {CreateAccount} from '@src/components/auth/signUp/CreateAccount';

let count = 0;

const ViewModelError: React.FC<{ error: Error }> = ({error}) => {
    return (<View style={styles.container}>
        <Text style={styles.error}>
            Error loading sign up screen: {error.message}
        </Text>
    </View>)
}

const LoadingView: React.FC = () => {
    return (
        <View style={styles.container}>
            <ActivityIndicator size="large"/>
            <Text style={styles.loadingText}>Loading...</Text>
        </View>
    )
}

const SignUpScreen: React.FC = observer(() => {
    const {viewModel, isInitialized, error: viewModelError} = useViewModel(SignUpViewModel);
    const navigation = useRouter();

    // Local state for validation
    const [emailError, setEmailError] = useState<string | null>(null);
    const [passwordError, setPasswordError] = useState<string | null>(null);

    const handleSignUp = useCallback(async () => {
        if (!viewModel) return;

        const result = await viewModel.signUp();
        if (result.isOk()) {
            // Form is already cleared in the ViewModel
            navigation.navigate('Welcome');
        }
    }, [viewModel, navigation]);

    const handleNavigateToSignIn = useCallback(() => {
        navigation.navigate('SignIn');
    }, [navigation]);

    // Email validation on blur
    const handleEmailBlur = useCallback(() => {
        if (!viewModel) return;

        const email = viewModel.email$.get();

        // Only validate if email is not empty
        if (email && !isValidEmail(email)) {
            setEmailError('Please enter a valid email address');
        } else {
            setEmailError(null);
        }
    }, [viewModel]);

    // Password validation on blur
    const handlePasswordBlur = useCallback(() => {
        if (!viewModel) return;

        const password = viewModel.password$.get();
        const confirmPassword = viewModel.confirmPassword$.get();

        if (!password || !confirmPassword) {
            setPasswordError(null);
            return;
        }

        if (password && confirmPassword && password !== confirmPassword) {
            setPasswordError('Passwords do not match');
        } else {
            setPasswordError(null);
        }
    }, [viewModel]);

    const handleKeyPress = useCallback((e: any) => {
        if (e.nativeEvent.key === 'Enter') {
            handleSignUp();
        }
    }, [handleSignUp]);

    console.log("~~~~ Rendering SignUpScreen ~~~~", count++, isInitialized);

    if (viewModelError) {
        return (
            <View style={styles.container}>
                <Text style={styles.error}>
                    Error loading sign up screen: {viewModelError.message}
                </Text>
            </View>
        );
    }

    if (!isInitialized || !viewModel) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large"/>
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    return (
        <CreateAccount />
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.backgroundDefault,
        justifyContent: 'flex-end',
        padding: 24,
    },
    input: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        marginBottom: 12,
        paddingHorizontal: 8,
        borderRadius: 4,
    },
    inputError: {
        borderColor: 'red',
    },
    error: {
        color: 'red',
        marginBottom: 12,
        textAlign: 'center',
    },
    linkText: {
        marginTop: 16,
        color: 'blue',
        textAlign: 'center',
    },
    loadingText: {
        marginTop: 8,
        textAlign: 'center',
    },
});

export default SignUpScreen;