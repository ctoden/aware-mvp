import * as React from "react";
import {useCallback, useEffect, useMemo, useState} from "react";
import {StyleSheet, Text, TouchableOpacity, useWindowDimensions, View} from "react-native";
import WhiteRightArrow from '@src/components/icons/WhiteRightArrow';
import EmailIcon from '@src/components/icons/EmailIcon';

import {SocialButton} from "./SocialButton";
import {IconButton} from "./IconButton";
import {AwareBall} from "@app/components/AwareBall";
import {IntroViewModel} from "@src/viewModels/IntroViewModel";
import {useViewModel} from "@src/hooks/useViewModel";
import Toast from 'react-native-toast-message';
import {useRouter} from "expo-router";
import AppleIcon from "../icons/AppleIcon";
import GoogleIcon from "../icons/GoogleIcon";
import PhoneIcon from "../icons/PhoneIcon";
import { getAppVersion, getAppVersionDirect } from "@src/utils/AppUtils";
import { Colors } from 'react-native-ui-lib';

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
      // Linear interpolation
      return minHeight + ((screenHeight - minScreenHeight) / (maxScreenHeight - minScreenHeight)) * (maxHeight - minHeight);
  }
};

export const AuthScreen: React.FC = () => {
  const { viewModel: introViewModel } = useViewModel(IntroViewModel);
  const navigator = useRouter();
  const currentStep = introViewModel.lastStep;
  const { height } = useWindowDimensions();

  // Add state to force refresh
  const [refreshKey, setRefreshKey] = useState(0);
  
  const handleSocialAuth = useCallback((method: string) => {
    if (method === 'email') {
      console.log(`Authenticating with ${method}`);
      navigator.navigate('SignIn');
    } else {
      Toast.show({
        type: 'info',
        text1: 'Coming Soon',
        text2: 'This authentication method is not implemented yet',
        position: 'bottom',
        visibilityTime: 2000,
      });
    }
  }, []);

  const dynamicHeight = useMemo(() => calculateDynamicHeight(height), [height]);
  
  // Get the app version directly without memoization to ensure it's always fresh
  const appVersion = getAppVersionDirect();
  
  // Log the version for debugging
  useEffect(() => {
    console.log('AuthScreen - App Version:', appVersion);
  }, [appVersion, refreshKey]);
  
  // Function to force refresh the version
  const refreshVersion = useCallback(() => {
    console.log('Forcing version refresh');
    setRefreshKey(prev => prev + 1);
  }, []);

  return (
    <View style={styles.container}>
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
        <View style={styles.headerContainer}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Get started</Text>
          </View>
        </View>

        <View style={styles.subtitleContainer}>
          <Text style={styles.subtitle}>
            Begin your journey of self-discovery
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <SocialButton
            icon={PhoneIcon}
            text="Continue with phone"
            rightIcon={WhiteRightArrow}
            onPress={() => handleSocialAuth("phone")}
          />

          <SocialButton
            icon={EmailIcon}
            text="Continue with email"
            rightIcon={WhiteRightArrow}
            onPress={() => handleSocialAuth("email")}
          />

          <View style={styles.iconButtonContainer}>
            <IconButton
              icon={AppleIcon}
              onPress={() => handleSocialAuth("apple")}
            />
            <IconButton
              icon={GoogleIcon}
              onPress={() => handleSocialAuth("google")}
            />
          </View>
          
          <TouchableOpacity onPress={refreshVersion}>
            <Text style={styles.versionText}>Version {appVersion}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
    flexDirection: 'column', // Stack items vertically
  },
  backgroundTop: {
    minHeight: 10,
    maxHeight: 99,
    width: '100%',
  },
  backgroundBottom: {
    flexGrow: 1, // Grow proportionally, twice the rate of the top section
    width: '100%',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    display: "flex",
    alignItems: "flex-start",
    overflow: "hidden",
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
    position: "absolute",
    zIndex: 0,
    minWidth: 240,
    paddingHorizontal: 22,
    paddingTop: 14,
    left: "50%",
    bottom: 0,
    transform: [{ translateX: -184 }],
    width: 368,
    height: 369,
    backgroundColor: "#FFFFFF",
    marginBottom: 20
  },
  headerContainer: {
    display: "flex",
    width: "100%",
    alignItems: "flex-start",
    gap: 20,
    justifyContent: "space-between",
    flexDirection: "row",
  },
  titleContainer: {
    marginTop: 30,
  },
  title: {
    color: "#212120",
    fontSize: 24,
    fontFamily: "Work Sans, sans-serif",
    fontWeight: "600",
    letterSpacing: -0.46,
  },
  closeButtonContainer: {
    borderRadius: 50,
    minHeight: 32,
    width: 32,
    padding: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  closeIcon: {
    width: 12,
    aspectRatio: 1,
  },
  subtitleContainer: {
    marginTop: 8,
  },
  subtitle: {
    color: "#212120",
    fontSize: 16,
    fontFamily: "Work Sans, sans-serif",
    fontWeight: "400",
    letterSpacing: -0.3,
  },
  buttonContainer: {
    marginTop: 29,
    width: "100%",
    gap: 12,
  },
  iconButtonContainer: {
    display: "flex",
    width: "100%",
    flexDirection: "row",
    gap: 8,
  },
  versionText: {
    color: Colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 11,
    opacity: 0.7
  },
});
