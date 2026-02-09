import React, { FC, useState } from 'react';
import { Modal, StyleSheet, TouchableOpacity, View, StyleProp, ViewStyle, Platform } from 'react-native';
import { Colors, Text } from 'react-native-ui-lib';
import { Picker } from '@react-native-picker/picker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Observable } from '@legendapp/state';
import { ButtonRegular } from './text/ButtonRegular';
import { elementColors } from '@app/constants/theme';

interface PickerOption {
    label: string;
    value: string;
}

interface ModalPickerProps {
    value$: Observable<string>;
    options: PickerOption[];
    placeholder?: string;
    label?: string;
    buttonStyle?: StyleProp<ViewStyle>;
    disabled?: boolean;
}

export const ModalPicker: FC<ModalPickerProps> = ({
    value$,
    options,
    placeholder = 'Select an option',
    label,
    buttonStyle,
    disabled = false,
}) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [tempValue, setTempValue] = useState<string>(value$.get());

    const handleConfirm = () => {
        value$.set(tempValue);
        setModalVisible(false);
    };

    const handleCancel = () => {
        setTempValue(value$.get());
        setModalVisible(false);
    };

    const selectedOption = options.find(opt => opt.value === value$.get());

    // Ensure options are properly formatted for iOS
    const formattedOptions = options.map(option => ({
        ...option,
        label: Platform.OS === 'ios' ? option.label.toString() : option.label,
        value: option.value.toString() // Ensure value is string
    }));

    return (
        <View>
            {label && <Text style={styles.label}>{label}</Text>}
            <TouchableOpacity
                style={[styles.button, buttonStyle]}
                onPress={() => !disabled && setModalVisible(true)}
                disabled={disabled}>

                <Text style={[styles.buttonText, disabled && styles.disabledText]}>
                    <ButtonRegular>{selectedOption?.label || placeholder}</ButtonRegular>
                </Text>
                <Ionicons name="chevron-down" size={20} color={disabled ? Colors.textDisabled : "#000"} />
            </TouchableOpacity>

            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={handleCancel}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <TouchableOpacity onPress={handleCancel}>
                                <Text style={styles.modalHeaderButton}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleConfirm}>
                                <Text style={styles.modalHeaderButton}>Done</Text>
                            </TouchableOpacity>
                        </View>
                        {Platform.OS === 'ios' ? (
                            <Picker
                                selectedValue={tempValue}
                                onValueChange={(itemValue) => setTempValue(itemValue)}
                                itemStyle={styles.pickerItem} // iOS specific style
                            >
                                {formattedOptions.map((option) => (
                                    <Picker.Item
                                        key={option.value}
                                        label={option.label}
                                        value={option.value}
                                        color="#000000" // Ensure text is visible
                                    />
                                ))}
                            </Picker>
                        ) : (
                            <Picker
                                selectedValue={tempValue}
                                onValueChange={setTempValue}
                            >
                                {formattedOptions.map((option) => (
                                    <Picker.Item
                                        key={option.value}
                                        label={option.label}
                                        value={option.value}
                                    />
                                ))}
                            </Picker>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    pickerItem: {
        fontSize: 16,
        height: 44,
        color: '#000000',
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: elementColors.inputBorderColor,
        borderRadius: 90,
        padding: 12,
        backgroundColor: elementColors.inputBackground,
    },
    buttonText: {
        fontSize: 16,
    },
    disabledText: {
        color: Colors.textDisabled,
    },
    label: {
        fontSize: 14,
        color: '#545452',
        marginBottom: 8,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20, // Extra padding for iOS
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    modalHeaderButton: {
        fontSize: 16,
        color: Colors.primary,
        fontWeight: '500',
    },
}); 
