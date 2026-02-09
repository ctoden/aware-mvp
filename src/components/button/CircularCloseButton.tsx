import { customColors, elementColors } from '@app/constants/theme';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { CloseXIcon } from '../icons/CloseXIcon';
interface CircularCloseButtonProps {
    onPress: () => void;
}
const CircularCloseButton: React.FC<CircularCloseButtonProps> = ({ onPress }) => {
    return (
        <TouchableOpacity
            flex-2
            onPress={onPress}
            style={styles.closeBtn}
        >
            <CloseXIcon color={customColors.white} />
        </TouchableOpacity>)
}
export default CircularCloseButton;

const styles = StyleSheet.create({
    closeBtn: {
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
        borderWidth: 1,
        borderColor: elementColors.inputBorderColor,
        backgroundColor: '#000',
        borderRadius: 90,
    },
});
