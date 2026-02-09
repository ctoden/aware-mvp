import * as React from "react";
import { StyleSheet, Image, TouchableOpacity } from "react-native";

interface IconButtonProps {
  icon: string | React.ComponentType<any>;
  onPress: () => void;
}

export const IconButton: React.FC<IconButtonProps> = ({ icon, onPress }) => {
  const IconComponent = typeof icon !== "string" ? icon : null;

  return (
    <TouchableOpacity style={styles.iconButton} onPress={onPress}>
      {typeof icon === "string" ? (
        <Image resizeMode="contain" source={{ uri: icon }} style={styles.icon} />
      ) : IconComponent && (
        <IconComponent style={styles.icon} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  iconButton: {
    borderRadius: 50,
    borderColor: "#212120",
    borderStyle: "solid",
    borderWidth: 1,
    display: "flex",
    minHeight: 57,
    paddingHorizontal: 24,
    paddingVertical: 20,
    alignItems: "center",
    overflow: "hidden",
    justifyContent: "center",
    flex: 1,
  },
  icon: {
    alignSelf: "center",
    width: 16,
    aspectRatio: 1,
  },
});
