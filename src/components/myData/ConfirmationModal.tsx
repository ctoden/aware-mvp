import { customColors } from '@app/constants/theme';
import { Modal, StyleSheet, TouchableOpacity, Platform, Dimensions, View as RNView } from 'react-native'
import { Text, View } from 'react-native-ui-lib'
import { CloseXIcon } from '../icons/CloseXIcon';
import { BodyRegular } from '../text/BodyRegular';
import { ButtonRegular } from '../text/ButtonRegular';
import { useEffect } from 'react';

export interface ConfirmationData {
    title: string;
    message: string;
    primaryButtonText: string;
    secondaryButtonText: string;
    primaryAction: () => void;
    secondaryAction: () => void;
}
interface IConfirmationWindowProps {
    modalData: ConfirmationData | undefined;
    confirmationOpen: boolean;
}

export const ConfirmationModal: React.FC<IConfirmationWindowProps> = ({ 
    modalData,
    confirmationOpen
}) => {
    // On iOS, we'll use a completely different approach
    if (Platform.OS === 'ios') {
        return (
            <Modal
                visible={confirmationOpen}
                transparent={true}
                animationType="fade"
                presentationStyle="overFullScreen"
                onRequestClose={modalData?.secondaryAction}>
                <View style={styles.iosOverlay}>
                    <View style={styles.iosModal}>
                        <View style={styles.iosHeaderRow}>
                            <Text style={styles.iosTitle}>{modalData?.title}</Text>
                            <TouchableOpacity 
                                style={styles.iosCloseButton} 
                                onPress={modalData?.secondaryAction}>
                                <CloseXIcon />
                            </TouchableOpacity>
                        </View>
                        
                        <Text style={styles.iosMessage}>{modalData?.message}</Text>
                        
                        <View style={styles.iosButtonRow}>
                            <TouchableOpacity 
                                style={styles.iosLogoutButton} 
                                onPress={modalData?.primaryAction}>
                                <Text style={styles.iosLogoutText}>{modalData?.primaryButtonText}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={styles.iosCloseButtonLarge} 
                                onPress={modalData?.secondaryAction}>
                                <Text style={styles.iosCloseText}>{modalData?.secondaryButtonText}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        );
    }
    
    // Non-iOS version (unchanged from previous)
    return (
        <Modal
            visible={confirmationOpen}
            transparent={true}
            animationType="fade"
            onRequestClose={modalData?.secondaryAction}>
            <View style={styles.confirmationContainer}>
                <View style={styles.confirmationBox}>
                    <View style={styles.confirmationHeader}>
                        <Text style={styles.confirmationTitle}>{modalData?.title}</Text>
                        <TouchableOpacity style={styles.confirmationCloseButton} onPress={modalData?.secondaryAction}>
                            <CloseXIcon />
                        </TouchableOpacity>
                    </View>
                    <RNView style={styles.messageContainer}>
                        <BodyRegular noMargins noPadding>{modalData?.message}</BodyRegular>
                    </RNView>
                    <View style={styles.confirmationButtons}>
                        <TouchableOpacity 
                            style={[
                                styles.confirmationButton, 
                                styles.confirmationPrimaryButton
                            ]} 
                            onPress={modalData?.primaryAction}>
                            <ButtonRegular color={customColors.white}>{modalData?.primaryButtonText}</ButtonRegular>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[
                                styles.confirmationButton, 
                                styles.confirmationSecondaryButton
                            ]} 
                            onPress={modalData?.secondaryAction}>
                            <ButtonRegular color={customColors.black1}>{modalData?.secondaryButtonText}</ButtonRegular>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    // iOS specific styles - a completely different approach
    iosOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    iosModal: {
        width: 330,
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 16,
        paddingVertical: 14,
    },
    iosHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    iosTitle: {
        fontSize: 22,
        fontFamily: 'WorkSansSemiBold',
        fontWeight: '600',
        letterSpacing: -0.48,
    },
    iosMessage: {
        fontSize: 16,
        marginBottom: 12,
        fontFamily: 'WorkSansRegular',
        color: '#000',
        textAlign: 'left',
    },
    iosCloseButton: {
        width: 32,
        height: 32,
        backgroundColor: customColors.beige2,
        borderRadius: 90,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iosButtonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        gap: 8,
    },
    iosLogoutButton: {
        flex: 1,
        backgroundColor: customColors.redDeep,
        borderRadius: 90,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iosCloseButtonLarge: {
        flex: 1,
        borderColor: '#000',
        borderWidth: 1,
        borderRadius: 90,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iosLogoutText: {
        color: 'white',
        fontSize: 16,
        fontFamily: 'WorkSansSemiBold',
        fontWeight: '600',
    },
    iosCloseText: {
        color: '#000',
        fontSize: 16,
        fontFamily: 'WorkSansSemiBold',
        fontWeight: '600',
    },

    // Original styles for non-iOS platforms
    confirmationContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    confirmationBox: {
        backgroundColor: customColors.white,
        padding: 12,
        borderRadius: 24,
        width: 320,
        maxWidth: '90%',
        alignSelf: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    confirmationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginBottom: 4,
    },
    confirmationTitle: {
        fontSize: 22,
        fontFamily: 'WorkSansSemiBold',
        fontWeight: '600',
        letterSpacing: -0.48,
        flex: 1,
    },
    messageContainer: {
        marginBottom: 8,
        marginTop: 2,
        width: '100%',
        alignItems: 'flex-start',
    },
    confirmationCloseButton: {
        width: 32,
        height: 32,
        backgroundColor: customColors.beige2,
        borderRadius: 90,
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmationButtons: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 0,
        gap: 8,
    },
    confirmationButton: {
        flex: 1,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 90,
    },
    confirmationPrimaryButton: {
        backgroundColor: customColors.redDeep,
        paddingHorizontal: 20,
        paddingVertical: 8,
    },
    confirmationSecondaryButton: {
        borderWidth: 1,
        borderColor: customColors.black1,
        backgroundColor: 'transparent',
        paddingHorizontal: 20,
        paddingVertical: 8,
    }
})