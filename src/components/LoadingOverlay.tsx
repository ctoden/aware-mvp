import React, { FC } from 'react';
import { ActivityIndicator, Modal, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-ui-lib';
import { customColors } from '@app/constants/theme';

interface LoadingOverlayProps {
    visible: boolean;
    message?: string;
}

export const LoadingOverlay: FC<LoadingOverlayProps> = ({ visible, message }) => {
    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => {}}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <ActivityIndicator size="large" color={customColors.black1} />
                    {message && (
                        <Text style={styles.message}>{message}</Text>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        gap: 16,
    },
    message: {
        fontSize: 16,
        color: customColors.black1,
        textAlign: 'center',
    },
}); 