import * as React from "react";
import { View, StyleSheet, Image, Text, TouchableOpacity } from "react-native";
import { SocialButtonProps } from "./types";

const RenderIcon = ({ 
  icon, 
  style 
}: { 
  icon: string | React.ComponentType<any> | React.ReactElement;
  style: any;
}) => {
  if (typeof icon === "string") {
    return <Image resizeMode="contain" source={{ uri: icon }} style={style} />;
  }
  if (React.isValidElement(icon)) {
    return icon;
  }
  const IconComponent = icon as React.ComponentType<any>;
  return <IconComponent style={style} />;
};

export const SocialButton: React.FC<SocialButtonProps> = ({
  icon,
  text,
  onPress,
  rightIcon,
}) => {
  return (
    <TouchableOpacity style={styles.socialButton} onPress={onPress}>
      <RenderIcon icon={icon} style={styles.leftIcon} />
      <View style={styles.textContainer}>
        <Text style={styles.buttonText}>{text}</Text>
      </View>
      {rightIcon && <RenderIcon icon={rightIcon} style={styles.rightIcon} />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  socialButton: {
    borderRadius: 50,
    display: "flex",
    minHeight: 57,
    width: "100%",
    paddingHorizontal: 24,
    paddingVertical: 19,
    alignItems: "center",
    gap: 40,
    overflow: "hidden",
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#212120",
  },
  leftIcon: {
    width: 18,
    aspectRatio: 1,
  },
  textContainer: {
    flex: 1,
  },
  buttonText: {
    fontFamily: "Work Sans, sans-serif",
    fontSize: 16,
    color: "#F0EBE4",
    fontWeight: "600",
    letterSpacing: -0.3,
  },
  rightIcon: {
    width: 13,
    aspectRatio: 1.86,
  },
});
