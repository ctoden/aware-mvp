import * as React from "react";
import { View, StyleSheet } from "react-native";
import { Header } from "./components/Header";
import { SignInForm } from "./components/SignInForm";
import { Footer } from "./components/Footer";

interface SignInViewProps {
    onSignIn: (email: string, password: string) => void;
    onCreateAccount: () => void;
}

export const SignInView: React.FC<SignInViewProps> = ({ onSignIn, onCreateAccount }) => {
    return (
        <View style={styles.container}>
            <Header />
            <SignInForm onSubmit={onSignIn} onCreateAccount={onCreateAccount}/>
            <Footer onCreateAccount={onCreateAccount} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 30,
        display: "flex",
        maxWidth: 368,
        paddingLeft: 21,
        paddingRight: 21,
        paddingTop: 5,
        paddingBottom: 15,
        flexDirection: "column",
        overflow: "hidden",
        alignItems: "stretch",
    },
});