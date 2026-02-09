import React, { FC, useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { Colors, Text, TouchableOpacity, View } from 'react-native-ui-lib';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { customColors } from '@app/constants/theme';
import { useViewModel } from '@src/hooks/useViewModel';
import { FTUX_Routes } from '@src/models/NavigationModel';
import { NavigationViewModel } from '@src/viewModels/NavigationViewModel';
import { AvatarViewModel } from '@src/viewModels/AvatarViewModel';
import { Memo } from '@legendapp/state/react';
import { showErrorToast } from '@src/utils/ToastUtils';

export const AddAvatarScreen: FC = () => {
    const { viewModel: navigationVM } = useViewModel(NavigationViewModel);
    const { viewModel: avatarVM } = useViewModel(AvatarViewModel);
    
    const handleNavigateToIndex = useCallback(() => {
        navigationVM.navigateToIndex();
    }, [navigationVM]);

    const saveAvatar = useCallback(async () => {
        const result = await avatarVM.saveAvatar();
        if (result.isErr()) {
            showErrorToast('Failed to save avatar');
            return false;
        }
        return true;
    }, [avatarVM]);

    const handleDone = useCallback(async () => {
        await saveAvatar();
        navigationVM.navigateToIndex();
    }, [saveAvatar, navigationVM]);

    const handleContinue = useCallback(async () => {
        const success = await saveAvatar();
        if (success) {
            router.push(navigationVM.getRouteFor(FTUX_Routes.IntroducingYou));
        }
    }, [saveAvatar, navigationVM]);

    const handleAddAvatar = useCallback(() => {
        // TODO: Implement avatar selection logic
        avatarVM.updateAvatar('🙂'); // Temporary emoji for testing
    }, [avatarVM]);

    return (
        <View flex padding-page style={{ backgroundColor: Colors.backgroundLight }}>
            <View row spread marginB-20>
                <TouchableOpacity onPress={handleNavigateToIndex}>
                    <Text buttonRegular>
                        Cancel
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDone}>
                    <Text buttonRegular>
                        Done
                    </Text>
                </TouchableOpacity>
            </View>
            <View center left br50 paddingH-8 paddingV-4 style={{ backgroundColor: customColors.beige2, width: 40 }}>
                <Text labelText>9/9</Text>
            </View>
            <View left marginT-20>
                <Text h2>What do you look like?</Text>
            </View>
            <View left marginT-20>
                <Text labelRegular>...in emoji form, that is. Be as creative as you want. This question is just for fun!</Text>
            </View>

            <View flex>
                <View row centerV marginT-20>
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={handleAddAvatar}
                    >
                        <Text style={styles.addButtonText}>Add</Text>
                    </TouchableOpacity>
                    <Memo>
                        {() => (
                            <Text labelRegular marginL-10>
                                {avatarVM.avatar$.get().emoji || 'Choose an emoji for your profile image.'}
                            </Text>
                        )}
                    </Memo>
                </View>
            </View>

            <View style={styles.bottomContainer}>
                <Memo>
                    {() => (
                        <TouchableOpacity
                            style={[
                                styles.continueButton,
                                !avatarVM.isValid$.get() && styles.disabledButton
                            ]}
                            onPress={handleContinue}
                            disabled={!avatarVM.isValid$.get()}
                        >
                            <Text style={styles.continueButtonText}>Continue</Text>
                            <Ionicons name="arrow-forward" size={20} color="#FFF" />
                        </TouchableOpacity>
                    )}
                </Memo>
                <TouchableOpacity
                    onPress={handleContinue}
                    style={{ cursor: 'pointer' }}
                >
                    <Text labelSecondary underline>
                        Skip for now
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    addButton: {
        backgroundColor: customColors.beige2,
        padding: 16,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 100,
    },
    addButtonText: {
        color: Colors.textPrimary,
        fontSize: 16,
        fontWeight: '500',
    },
    bottomContainer: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 16,
    },
    continueButton: {
        backgroundColor: '#000',
        padding: 16,
        borderRadius: 24,
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    disabledButton: {
        opacity: 0.5,
    },
    continueButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '500',
    },
});

export default AddAvatarScreen; 