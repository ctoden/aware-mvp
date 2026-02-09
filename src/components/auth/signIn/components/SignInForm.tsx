import * as React from "react";
import {useCallback} from "react";
import {ActivityIndicator, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import {useViewModel} from "@src/hooks/useViewModel";
import {SignInViewModel} from "@src/viewModels/SignInViewModel";
import {ReactiveTextField} from "@src/components/ReactiveTextField";
import {observer} from "@legendapp/state/react";
import EmailIcon from "@src/components/icons/EmailIcon";
import WhiteRightArrow from "@src/components/icons/WhiteRightArrow";

interface SignInFormProps {
    onSubmit: (email: string, password: string) => void;
    onCreateAccount: () => void;
}

export const SignInForm: React.FC<SignInFormProps> = observer(({ onSubmit, onCreateAccount }) => {
    const { viewModel, isInitialized, error: viewModelError } = useViewModel(SignInViewModel);
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");

    const handleSubmit = useCallback(() => {
        onSubmit(email, password);
    }, [onSubmit]);

    const handleCreateAccount = useCallback(() => {
        onCreateAccount();
    }, [onCreateAccount]);

    const handleKeyPress = useCallback((e: any) => {
        if (e.nativeEvent.key === 'Enter') {
            handleSubmit();
        }
    }, [handleSubmit]);

    return (
        <View style={styles.container}>
            <View style={styles.titleContainer}>
                <Text style={styles.title}>Sign in to your account</Text>
                <TouchableOpacity
                    onPress={handleCreateAccount}
                    accessibilityLabel="Create account link"
                    accessibilityRole="link"
                >
                    <Text style={styles.subtitle}>Don't have an account? Sign up here</Text>
                </TouchableOpacity>

                {viewModel?.error$.get() && (
                    <Text style={styles.error}>{viewModel.error$.get()}</Text>
                )}
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <ReactiveTextField
                    placeholder="Email"
                    style={styles.input}
                    value$={viewModel?.email$}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    testID="email-input"
                    onKeyPress={handleKeyPress}
                    accessibilityLabel="Email input"
                    accessibilityHint="Enter your email address"
                />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <ReactiveTextField
                    placeholder="Password"
                    value$={viewModel?.password$}
                    onKeyPress={handleKeyPress}
                    secureTextEntry
                    testID="password-input"
                    style={styles.input}
                    accessibilityLabel="Password input"
                    accessibilityHint="Enter your password"
                />
            </View>

            {viewModel?.isLoading$.get() ? (
                <ActivityIndicator testID="loading-indicator" style={styles.loader} />
            ) : (

                <TouchableOpacity
                    style={styles.loginButton}
                    onPress={handleSubmit}
                    accessibilityLabel="Log in button"
                    testID="sign-in-button"
                    accessibilityRole="button"
                >
                    <EmailIcon style={styles.buttonLeftIcon} />
                    <Text style={styles.buttonText}>Log In</Text>
                    <WhiteRightArrow style={styles.buttonRightIcon}/>
                </TouchableOpacity>
            )}
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        width: "100%",
    },
    titleContainer: {
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: "600",
        color: "rgba(33, 33, 32, 1)",
        letterSpacing: -0.46,
    },
    subtitle: {
        fontSize: 16,
        color: "#212120",
        letterSpacing: -0.24,
        marginTop: 5,
        textDecorationLine: "underline",
    },
    inputContainer: {
        marginBottom: 15,
    },
    label: {
        fontSize: 12,
        color: "#545452",
        marginBottom: 8,
    },
    input: {
        borderRadius: 24,
        borderWidth: 1,
        borderColor: "rgba(33, 33, 32, 1)",
        padding: 16,
        fontSize: 16,
        color: "#212120",
        width: "100%",
    },
    loginButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#212120",
        borderRadius: 50,
        padding: 19,
        marginTop: 10,
    },
    buttonText: {
        color: "#F0EBE4",
        fontSize: 16,
        fontWeight: "600",
        letterSpacing: -0.16,
    },
    buttonLeftIcon: {
        width: 17,
        aspectRatio: 1.42,
    },
    buttonRightIcon: {
        width: 13,
        aspectRatio: 1.86,
    },
    error: {
        color: "red",
        marginTop: 10,
        textAlign: "center",
    },
    loader: {
        marginTop: 27,
    },
});
