import React, { FC, useMemo } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { View, } from 'react-native-ui-lib';
import { customColors } from '@app/constants/theme';
import { H3 } from '@src/components/text/H3';
import { Title } from '@src/components/text/Title';
import { AIIcon } from '@src/components/icons/AIIcon';
import { ButtonTiny } from '@src/components/text/ButtonTiny';
import { ButtonRegular } from '@src/components/text/ButtonRegular';
import { Share2Icon, ShareIcon } from 'lucide-react';
import PencilIcon from '@src/components/icons/PencilIcon';
import PencilIconUnderlined from '@src/components/icons/PencilIconUnderlined';
import { GradientBackground } from '@src/components/common/GradientBackground';
import { useViewModel } from '@src/hooks/useViewModel';
import { RadialQualityGradientViewModel } from '@src/viewModels/topQualities/RadialQualityGradientViewModel';

interface AssessmentResultsProps {
    title: string;
}

export const AssessmentResultsCard: FC<AssessmentResultsProps> = ({ title }) => {
    const { viewModel } = useViewModel<RadialQualityGradientViewModel>(RadialQualityGradientViewModel);

    // Get top 3 qualities and their colors for the gradient
    const gradientColors = useMemo(() => {
        const topThreeQualities = [...viewModel.topQualities]
            .sort((a, b) => b.score - a.score)
            .slice(0, 3);

        return topThreeQualities.map(quality => quality.color || customColors.purple);
    }, [viewModel.topQualities]);

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <View style={styles.cardTitle} >
                    <H3 noMargins noPadding>Your results are:</H3>
                </View>
                <View style={styles.resultContent}>
                    <Title noMargins noPadding shadow>{title}</Title>
                    <View style={styles.resultSummary}>
                        <AIIcon />
                        <ButtonTiny>Results based on your uploads</ButtonTiny>
                    </View>
                    <View style={styles.horizontalButtonsContainer}>
                        <TouchableOpacity
                            style={styles.button}
                            onPress={() => { }}>
                            <GradientBackground
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    borderRadius: 0,
                                }}
                                angle={-90}
                                colors={gradientColors}
                                borderRadius={8}
                            />
                            <PencilIconUnderlined color={customColors.black1} width={25} height={25} />
                            <ButtonRegular color={customColors.black1}>Edit</ButtonRegular>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, styles.outlineButton]}
                            onPress={() => { }}>
                            <Share2Icon color={customColors.black1} />
                            <ButtonRegular color={customColors.black1}>Share</ButtonRegular>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        width: '100%',
    },
    card: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        backgroundColor: customColors.beige2,
        width: '100%',
        borderRadius: 24,
        padding: 16,
        marginTop: 26,
        marginBottom: 48
    },
    cardTitle: {
        alignSelf: 'flex-start'
    },
    resultContent: {
        display: 'flex',
        flexDirection: 'column',
    },
    resultType: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        marginBottom: 8,
    },
    resultSummary: {
        display: 'flex',
        flexDirection: 'row',
        gap: 8,
        justifyContent: 'flex-start',
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 16
    },
    myDataButtonsContainer: {
        flexDirection: 'column',
        gap: 12,
        alignItems: 'center',
    },
    horizontalButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        gap: 12,
    },
    button: {
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'row',
        gap: 13,
        backgroundColor: customColors.white,
        borderRadius: 90,
        paddingVertical: 16,
        paddingHorizontal: 24
    },
    outlineButton: {
        borderWidth: 1,
        borderColor: customColors.black1
    }
});
