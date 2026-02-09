import { observer } from '@legendapp/state/react';
import { ReactiveTextField } from '@src/components/ReactiveTextField';
import { useViewModel } from '@src/hooks/useViewModel';
import { FTUX_Routes } from '@src/models/NavigationModel';
import { NavigationViewModel } from '@src/viewModels/NavigationViewModel';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Typography } from 'react-native-ui-lib';
import { UserProfileViewModel } from '../../src/viewModels/UserProfileViewModel';
import Button from '../components/Button';

export const CreateUserProfileScreen = observer(() => {
    const router = useRouter();
    const { viewModel, isInitialized, error } = useViewModel(UserProfileViewModel);
    const { viewModel: navigationVM } = useViewModel(NavigationViewModel);
    const [loading, setLoading] = React.useState(false);

    const handleCreateAccount = async () => {
        if (!viewModel) return;

        setLoading(true);
        try {
            const success = await viewModel.saveProfile();
            if (success) {
                router.replace(navigationVM.getRouteFor(FTUX_Routes.ChooseAssessment));
            }
        } finally {
            setLoading(false);
        }
    };

    if (!isInitialized || !viewModel) {
        return null; // or a loading spinner
    }

    if (error) {
        return (
            <View style={[styles.container]}>
                <Text style={[Typography.body, styles.error]}>
                    Error initializing profile: {error.message}
                </Text>
            </View>
        );
    }

    return (
        <View style={[styles.container]}>
            <View style={styles.content}>
                <Text style={[Typography.heading, styles.title]}>Create your profile</Text>

                <View style={styles.inputContainer}>
                    <Text style={[Typography.body, styles.label]}>Full Name</Text>
                    <ReactiveTextField
                        style={styles.input}
                        value$={viewModel.formState$.fullName}
                        placeholder="Enter your full name"
                        autoCapitalize="words"
                    />
                </View>

                <View style={styles.buttonContainer}>
                    <Button
                        title="Create account"
                        onPress={handleCreateAccount}
                        disabled={!viewModel.formState$.fullName.get()}
                        loading={loading}
                        variant="primary"
                        style={styles.button}
                    />
                </View>
            </View>

            <View style={styles.footer}>
                <Text style={[Typography.body, styles.terms]}>
                    By continuing to use Aware, you agree to our{' '}
                    <Text style={styles.link}>Terms of Service</Text> and{' '}
                    <Text style={styles.link}>Privacy Policy</Text>
                </Text>
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        backgroundColor: Colors.background,
    },
    content: {
        flex: 1,
    },
    title: {
        marginBottom: 32,
    },
    inputContainer: {
        marginBottom: 24,
    },
    buttonContainer: {
        marginTop: 32,
        alignItems: 'center',
    },
    button: {
        width: 361,
    },
    label: {
        marginBottom: 8,
        color: Colors.trustworthinessColor,
    },
    input: {
        height: 48,
        borderWidth: 1,
        borderColor: Colors.darkBackground,
        borderRadius: 8,
        paddingHorizontal: 16,
        backgroundColor: Colors.background,
        ...Typography.body,
    },
    footer: {
        paddingVertical: 24,
    },
    terms: {
        textAlign: 'center',
        color: Colors.trustworthinessColor,
    },
    link: {
        color: Colors.communicationSkillsColor,
    },
    error: {
        color: 'red',
        textAlign: 'center',
        marginTop: 16,
    },
});

export default CreateUserProfileScreen;