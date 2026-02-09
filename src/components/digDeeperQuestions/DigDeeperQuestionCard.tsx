import * as React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from 'react-native-ui-lib';
import { DigDeeperQuestionCardProps } from './types';
import { customColors } from '@app/constants/theme';
import { Ionicons } from "@expo/vector-icons";
import { useViewModel } from '@src/hooks/useViewModel';
import { NavigationViewModel } from '@src/viewModels/NavigationViewModel';
import { H4 } from '../text/H4';
import { showErrorToast } from '@src/utils/ToastUtils';

export const DigDeeperQuestionCard: React.FC<DigDeeperQuestionCardProps> = ({ title }) => {
    const { viewModel: NavigationVM } = useViewModel(NavigationViewModel);

    const handleClick = () => {
        console.log("dig deeper question card clicked");
        showErrorToast("Feature Not Available", "This feature is coming soon in a future update.");
    };

    return (
        <TouchableOpacity onPress={handleClick}>
            <Card style={styles.traitCardContainer}>
                <View style={styles.traitCardContent}>
                    <H4>{title}</H4>
                    <Ionicons
                        name="chevron-forward"
                        size={14}
                        color={customColors.black1} />
                </View>
            </Card>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({

    traitCardContainer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 32,
        paddingHorizontal: 16,
        paddingVertical: 16,
        gap: 8,
        flexDirection: 'row',
        backgroundColor: customColors.beige2
    },
    traitCardContent: {
        alignSelf: 'stretch',
        display: 'flex',
        minWidth: 240,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
        flex: 1
    },
    traitCardTitle: {
        fontSize: 20,
        fontWeight: '600',
        lineHeight: 24,
        letterSpacing: -0.2,
        textAlign: 'left',
    },
    traitCardSubtitle: {
        fontSize: 16,
        fontWeight: '400',
        color: customColors.black1,
        letterSpacing: -0.3,
        flexGrow: 1
    },
    traitCardImage: {
        alignSelf: 'stretch',
        position: 'relative',
        display: 'flex',
        marginVertical: 'auto',
        width: 4,
        flexShrink: 0,
        aspectRatio: 0.5,
    },
});
