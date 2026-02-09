import {ColorValue} from "react-native";

export interface WelcomeHeaderProps {
    userName: string;
    emoji: string;
    message: string;
}

export interface ActionButtonProps {
    label: string;
    onPress: () => void;
    iconcolor?: ColorValue;
}