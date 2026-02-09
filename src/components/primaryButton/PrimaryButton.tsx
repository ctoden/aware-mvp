import React, { useCallback, useState } from "react";
import { View, StyleSheet, GestureResponderEvent, Platform, Pressable, PressableStateCallbackType } from "react-native";
import IconButton from "../secondaryButton/IconButton";

interface PressableStateWeb extends PressableStateCallbackType {
  hovered?: boolean;
}

export interface PrimaryButtonProps {
  leftIcon?: string;
  rightIcon?: string;
  children: React.ReactNode;
  onPress?: (event: GestureResponderEvent) => void;
  testID?: string;
  disabled?: boolean;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  leftIcon,
  rightIcon,
  children,
  onPress,
  testID = "primary-button",
  disabled = false,
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const handlePress = useCallback(
    (event: GestureResponderEvent) => {
      if (!disabled) {
        onPress?.(event);
      }
    },
    [onPress, disabled]
  );

  return (
    <Pressable
      style={(state: PressableStateWeb) => [
        styles.buttonContainer,
        !disabled && styles.activeButton,
        disabled && styles.disabledButton,
        (isPressed || (Platform.OS === 'web' && state.hovered)) && !disabled && styles.pressedButton,
      ]}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel="Primary button"
      accessibilityState={{ disabled }}
      onPress={handlePress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
    >
      {leftIcon && (
        <IconButton
          source={leftIcon}
          style={styles.iconButton}
          testID="left-icon"
        />
      )}
      <View style={styles.contentContainer}>{children}</View>
      {rightIcon && (
        <IconButton
          source={rightIcon}
          style={styles.iconButton}
          testID="right-icon"
        />
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    borderRadius: 90,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  activeButton: {
    borderColor: "#212120",
    backgroundColor: "#212120",
    color: "#FFFFFF",
  },
  disabledButton: {
    borderColor: "#D4C7B6",
    backgroundColor: "#D4C7B6",
    color: "#FFFFFF",
  },
  pressedButton: {
    backgroundColor: "rgba(33, 33, 32, 0.8)",
  },
  contentContainer: {
    alignSelf: "stretch",
    marginTop: "auto",
    marginBottom: "auto",
    flex: 1,
    alignItems: "center",
  },
  iconButton: {
    alignSelf: "stretch",
    marginTop: "auto",
    marginBottom: "auto",
  },
});

export default React.memo(PrimaryButton);