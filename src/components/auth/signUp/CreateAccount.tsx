import { observer } from "@legendapp/state/react";
import { ReactiveText } from "@src/components";
import { useViewModel } from "@src/hooks/useViewModel";
import { isValidEmail } from '@src/utils/EmailUtils';
import { SignUpViewModel } from "@src/viewModels/SignUpViewModel";
import { useRouter } from "expo-router";
import React, { useCallback, useState, useEffect } from "react";
import { StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { Text, TouchableOpacity, View } from "react-native-ui-lib";
import { InputField } from "./InputField";
import { getRandomFullName, getRandomEmail, getRandomPhone } from '@src/utils/RandomDataGenerator';
import { getFromEnv } from '@src/utils/EnvUtils';
import { LoadingOverlay } from '@src/components/LoadingOverlay';

export const CreateAccount: React.FC = observer(() => {
  const { viewModel, isInitialized, error: viewModelError } = useViewModel(SignUpViewModel);
  const navigation = useRouter();

  // Local state for validation
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Auto-fill function for debug mode
  useEffect(() => {
    if (viewModel && getFromEnv('EXPO_PUBLIC_DEBUG_MENU_ENABLED') === 'true') {
      // Generate random data using our custom utility
      const fullName = getRandomFullName();
      
      // Split the full name to get first and last name
      const nameParts = fullName.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
      
      // Generate email using the first and last name
      const email = getRandomEmail(firstName, lastName);
      const phoneNumber = getRandomPhone();
      const password = 'test123';

      // Set values in the view model
      viewModel.fullName$.set(fullName);
      viewModel.email$.set(email);
      viewModel.phoneNumber$.set(phoneNumber);
      viewModel.password$.set(password);
      viewModel.confirmPassword$.set(password);
    }
  }, [viewModel]);

  // Remove navigation effect since it's handled by NavigationViewModel
  const handleSignUp = useCallback(async () => {
    if (!viewModel) return;
    const result = await viewModel.signUp();
    
    // If successful, the form will already be cleared by the ViewModel
    // No need to manually clear here since it's handled in the ViewModel's signUp method
  }, [viewModel]);

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


  if (!isInitialized) {
    return <Text>Loading...</Text>;
  }

  if (viewModelError) {
    return <Text testID="error-message">{viewModelError.message}</Text>;
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 75 : 75}
    >
      <LoadingOverlay 
        visible={viewModel?.isLoading$.get() ?? false}
        message="Creating your account..."
      />
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity accessibilityRole="button" onPress={handleNavigateToSignIn}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity accessibilityRole="button">
              <Text style={styles.doneButton}>Done</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>Create an account</Text>

          {viewModel?.error$.get() && (
            <ReactiveText style={styles.formError} text$={viewModel.error$}/>
          )}

          <View style={styles.form}>
            <InputField
              label="Name *"
              value={viewModel?.fullName$}
              id="name"
              testID="name-input"
            />
            <InputField
              label="Email Address *"
              value={viewModel?.email$}
              id="email"
              testID="email-input"
              type="email"
              onBlur={handleEmailBlur}
              error={emailError}
              textContentType="emailAddress"
              autoCapitalize="none"
            />
            <InputField
              label="Phone number"
              value={viewModel?.phoneNumber$}
              id="phone"
              testID="phone-input"
            />
            <InputField
              label="Password *"
              value={viewModel?.password$}
              id="password"
              testID="password-input"
              textContentType="password"
              secureTextEntry
              onBlur={handlePasswordBlur}
              error={passwordError}
            />
            <InputField
              label="Confirm Password *"
              value={viewModel?.confirmPassword$}
              id="confirmPassword"
              testID="confirm-password-input"
              textContentType="password"
              secureTextEntry
              onBlur={handlePasswordBlur}
              error={passwordError}
              onKeyPress={handleKeyPress}
            />
          </View>
          
          <Text style={styles.termsText}>
            By continuing to use Aware, you agree to our Terms of Service and
            Privacy Policy
          </Text>

          <Text style={styles.requiredText}>* Fields are required</Text>

          <TouchableOpacity
            style={styles.createButton}
            accessibilityRole="button"
            accessibilityLabel="Create account"
            testID="sign-up-button"
            onPress={handleSignUp}
          >
            <Text style={styles.createButtonText}>Create account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    minHeight: '100%',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontFamily: "Work Sans",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cancelButton: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: -0.3,
    color: "rgba(33, 33, 32, 1)",
  },
  doneButton: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: -0.3,
    color: "rgba(212, 199, 182, 1)",
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    letterSpacing: -0.46,
    color: "rgba(33, 33, 32, 1)",
    marginTop: 38,
  },
  form: {
    marginTop: 32,
  },
  termsText: {
    fontSize: 12,
    fontFamily: "Inter",
    color: "rgba(33, 33, 32, 1)",
    textAlign: "center",
    marginTop: 10,
    lineHeight: 16,
  },
  createButton: {
    backgroundColor: "#000",
    borderRadius: 50,
    marginTop: 27,
    paddingVertical: 19,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  createButtonText: {
    color: "rgba(240, 235, 228, 1)",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: -0.3,
  },
  requiredText: {
    fontSize: 12,
    fontFamily: "Inter",
    color: "rgba(33, 33, 32, 0.7)",
    textAlign: "center",
    marginTop: 8,
  },
  formError: {
    color: "red",
    fontSize: 14,
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
});
