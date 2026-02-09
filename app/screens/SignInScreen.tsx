import React, {useCallback, useEffect, useMemo} from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {observer} from "@legendapp/state/react";
import {SignInViewModel} from '@src/viewModels/SignInViewModel';
import {useViewModel} from '@src/hooks/useViewModel';
import {useRouter} from 'expo-router';
import "@legendapp/state/config/enableReactNativeComponents";
import { ReactiveTextField } from '@src/components';
import { isAuthenticated$ } from '@src/models/SessionModel';
import {isNil} from "lodash";
import { AwareBall } from "@app/components/AwareBall";
import { IntroViewModel } from "@src/viewModels/IntroViewModel";
import { SignInView } from '@src/components/auth/signIn/SignInView';

const calculateDynamicHeight = (screenHeight: number) => {
  const minHeight = 0;
  const maxHeight = 99;
  const minScreenHeight = 50;
  const maxScreenHeight = 800;

  if (screenHeight <= minScreenHeight) {
      return minHeight;
  } else if (screenHeight >= maxScreenHeight) {
      return maxHeight;
  } else {
      return minHeight + ((screenHeight - minScreenHeight) / (maxScreenHeight - minScreenHeight)) * (maxHeight - minHeight);
  }
};

const SignInScreen: React.FC = observer(() => {
  const {viewModel, isInitialized, error: viewModelError} = useViewModel(SignInViewModel);
  const { viewModel: introViewModel } = useViewModel(IntroViewModel);
  const router = useRouter();
  const { height } = useWindowDimensions();
  const currentStep = introViewModel.lastStep;

  const dynamicHeight = useMemo(() => calculateDynamicHeight(height), [height]);

  useEffect(() => {
    if (isAuthenticated$.get()) {
      router.navigate('/');
    }
  }, [router]);

  const handleSignIn = useCallback(async () => {
    if (!viewModel) return;
    await viewModel.signIn();
    if (isNil(viewModel.error$.get())) {
      router.navigate('/');
    }
  }, [viewModel, router]);

  const handleNavigateToSignUp = useCallback(() => {
    router.navigate('SignUp');
  }, [router]);

  if (!isInitialized) {
    return (
      <View style={styles.container}>
        <ActivityIndicator />
      </View>
    );
  }

  if (viewModelError) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>
          Error loading sign in screen: {viewModelError.message}
        </Text>
      </View>
    );
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
      >
        <View style={styles.backgroundContainer}>
          <View style={[styles.backgroundTop, { height: dynamicHeight }]} />
          <View style={styles.backgroundBottom}>
            <AwareBall step={currentStep} />
          </View>
        </View>

        <View style={styles.brandContainer}>
          <Text style={[styles.brandText, { marginTop: dynamicHeight + 150 }]}>aware</Text>
        </View>

        <View style={styles.authContainer}>
          <SignInView 
            onSignIn={handleSignIn}
            onCreateAccount={handleNavigateToSignUp}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
});

const styles = StyleSheet.create({
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
    flexDirection: 'column',
  },
  backgroundTop: {
    minHeight: 10,
    maxHeight: 99,
    width: '100%',
  },
  backgroundBottom: {
    flexGrow: 1,
    width: '100%',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: "#F0EBE4",
  },
  brandContainer: {
    width: "100%",
    overflow: "hidden",
    alignItems: "center",
  },
  brandText: {
    fontFamily: "PoetsenOne, sans-serif",
    fontSize: 56,
    color: "#F0EBE4",
    fontWeight: "400",
    letterSpacing: -1.69,
  },
  authContainer: {
    borderRadius: 30,
    zIndex: 0,
    minWidth: 240,
    paddingHorizontal: 22,
    paddingTop: 14,
    marginHorizontal: 'auto',
    width: 368,
    backgroundColor: "#FFFFFF",
    marginBottom: 20,
    alignSelf: 'center',
    marginTop: 'auto',
  },
  modalContent: {
    flex: 1,
    width: "100%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  cancelButton: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: -0.3,
    color: "rgba(33, 33, 32, 1)",
  },
  title: {
    color: "#212120",
    fontSize: 24,
    fontFamily: "Work Sans, sans-serif",
    fontWeight: "600",
    letterSpacing: -0.46,
    marginBottom: 8,
  },
  form: {
    marginTop: 32,
  },
  input: {
    height: 40,
    borderColor: 'rgba(212, 199, 182, 1)',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  error: {
    color: 'red',
    marginBottom: 12,
    textAlign: 'center',
  },
  loader: {
    marginTop: 27,
  },
  signInButton: {
    backgroundColor: "#000",
    borderRadius: 50,
    marginTop: 27,
    paddingVertical: 19,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  signInButtonText: {
    color: "rgba(240, 235, 228, 1)",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: -0.3,
  },
  linkText: {
    marginTop: 16,
    color: 'rgba(33, 33, 32, 1)',
    textAlign: 'center',
    fontSize: 12,
    fontFamily: "Inter",
  },
  scrollContainer: {
    flexGrow: 1,
    minHeight: '100%',
  },
});

export default SignInScreen;