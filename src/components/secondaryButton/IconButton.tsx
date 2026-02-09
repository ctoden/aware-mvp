import * as React from "react";
import { Image, StyleSheet, ViewStyle } from "react-native";
import { IconButtonProps } from "./SecondaryButton.types";

const IconButton: React.FC<IconButtonProps> = ({ source, style, testID }) => {
  return (
    <Image
      resizeMode="contain"
      source={{ uri: source }}
      style={[styles.icon, style]}
      testID={testID}
      accessibilityRole="image"
      accessible={true}
    />
  );
};

const styles = StyleSheet.create({
  icon: {
    width: 24,
    aspectRatio: 1,
    flexShrink: 0,
  },
});

export default IconButton;
