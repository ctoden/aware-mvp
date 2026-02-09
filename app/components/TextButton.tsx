import { customColors } from "@app/constants/theme"
import { ButtonRegular } from "@src/components/text/ButtonRegular";
import { TouchableOpacity, StyleSheet } from "react-native"
import TrashCanIcon from "@src/components/icons/TrashCanIcon";

interface ITextButtonProps {
    text: string;
    justifyContent?: 'flex-start' | 'center' | 'flex-end';
    padding?: number;
    onPress?: () => void;
}

const TextButton = ({ text, onPress, padding = 8, justifyContent = 'flex-start' }: ITextButtonProps) => {
    return (
        <TouchableOpacity
            activeOpacity={1}
            onPress={onPress}
            style={[
                textButtonStyles.button,
                { justifyContent: justifyContent },
                { padding: padding }
            ]}
        >
            <TrashCanIcon
                width={16}
                height={16}
                style={textButtonStyles.icon}
            />
            <ButtonRegular noMargins noPadding color={customColors.redDeep}>{text}</ButtonRegular>
        </TouchableOpacity>
    )
}

const textButtonStyles = StyleSheet.create({
    icon: {
        width: 16,
        aspectRatio: 1,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    }
});

export default TextButton;