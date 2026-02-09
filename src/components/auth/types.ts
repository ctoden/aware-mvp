export interface SocialButtonProps {
    icon: string | React.ComponentType<any> | React.ReactElement;
    text: string;
    onPress: () => void;
    rightIcon?: string | React.ComponentType<any> | React.ReactElement;
}

export interface IconButtonProps {
    icon: string;
    onPress: () => void;
    style?: object;
    testID?: string;
}
