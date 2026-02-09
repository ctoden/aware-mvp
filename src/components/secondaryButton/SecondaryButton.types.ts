import { GestureResponderEvent } from "react-native";

export interface SecondaryButtonProps {
  leftIcon?: string;
  rightIcon?: string;
  children: React.ReactNode;
  onPress?: (event: GestureResponderEvent) => void;
  testID?: string;
  disabled?: boolean;
}

export interface IconButtonProps {
  source: string;
  style?: object;
  testID?: string;
}
