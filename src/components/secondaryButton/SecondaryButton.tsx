import React, { useCallback, useState } from "react";
import { View, StyleSheet, GestureResponderEvent, Platform, Pressable, PressableStateCallbackType } from "react-native";
import { SecondaryButtonProps } from "./SecondaryButton.types";
import IconButton from "./IconButton";

interface PressableStateWeb extends PressableStateCallbackType {
  hovered?: boolean;
}

const SecondaryButton: React.FC<SecondaryButtonProps> = ({
  leftIcon,
  rightIcon,
  children,
  onPress,
  testID = "secondary-button",
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
      accessibilityLabel="Secondary button"
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
    borderRadius: 50,
    borderStyle: "solid",
    borderWidth: 1,
    display: "flex",
    paddingLeft: 24,
    paddingRight: 24,
    paddingTop: 16,
    paddingBottom: 16,
    alignItems: "center",
    gap: 4,
    overflow: "hidden",
    fontFamily: "Work Sans, sans-serif",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: -0.16,
    lineHeight: 16,
    justifyContent: "center",
    flexDirection: "row",
  },
  activeButton: {
    borderColor: "rgba(33, 33, 32, 1)",
    color: "#212120",
    backgroundColor: "transparent",
  },
  disabledButton: {
    borderColor: "rgba(212, 199, 182, 1)",
    color: "#D4C7B6",
    backgroundColor: "transparent",
  },
  pressedButton: {
    borderWidth: 2,
    backgroundColor: "rgba(33, 33, 32, 0.1)",
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

export default SecondaryButton;
