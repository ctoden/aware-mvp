import AwareBall from '@app/components/AwareBall';
import { observer } from '@legendapp/state/react';
import { BodyRegular } from '@src/components/text/BodyRegular';
import { ButtonRegular } from '@src/components/text/ButtonRegular';
import { H1 } from '@src/components/text/H1';
import { useViewModel } from '@src/hooks/useViewModel';
import { IntroViewModel } from '@src/viewModels/IntroViewModel';
import React, { FC, useCallback, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, Platform, TextStyle } from 'react-native';
import { Colors, View, Text, Button } from 'react-native-ui-lib';

const calculateDynamicHeight = (screenHeight: number) => {
    const minHeight = 10;
    const maxHeight = 99;
    const minScreenHeight = 400;
    const maxScreenHeight = 800;

    if (screenHeight <= minScreenHeight) {
        return minHeight;
    } else if (screenHeight >= maxScreenHeight) {
        return maxHeight;
    } else {
        // Linear interpolation
        return minHeight + ((screenHeight - minScreenHeight) / (maxScreenHeight - minScreenHeight)) * (maxHeight - minHeight);
    }
};

export const IntroScreen: FC = observer(() => {
    const { viewModel: introViewModel } = useViewModel(IntroViewModel);
    const currentStep = introViewModel.currentStep;
    const content = introViewModel.getStepContent(currentStep);
    const { height } = useWindowDimensions();

    const handleNext = useCallback(async () => {
        if (introViewModel.isLastStep()) {
            // This completes the intro flow (pre-authentication)
            // This is different from the FTUX flow which happens after authentication
            const result = await introViewModel.completeIntro();
            if (result.isOk()) {
                return;
            }
        } else {
            introViewModel.nextStep();
        }
    }, [introViewModel]);

    const dynamicHeight = useMemo(() => calculateDynamicHeight(height), [height]);

    return (
        <View style={styles.container}>

            <View style={styles.backgroundContainer}>
                <View style={[styles.backgroundTop, { height: dynamicHeight }]} />
                <View style={styles.backgroundBottom}>
                    <AwareBall step={currentStep} />
                </View>
            </View>

            <View style={styles.header}>
                <View style={styles.pagination}>
                    {Array.from({ length: introViewModel.totalSteps }).map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.paginationDot,
                                index === currentStep && styles.paginationDotActive,
                            ]}
                        />
                    ))}
                </View>
            </View>

            <View style={styles.content}>
                <H1>{content.title}</H1>
                <BodyRegular>{content.description}</BodyRegular>
            </View>

            <View style={styles.footer}>
                <Button
                    style={styles.button}
                    labelStyle={styles.buttonLabel}
                    onPress={handleNext}
                >
                    {introViewModel.isLastStep() ? <ButtonRegular>Get Started!</ButtonRegular> : <ButtonRegular>Continue →</ButtonRegular>}
                </Button>
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.backgroundDefault,
        justifyContent: 'flex-end',
        padding: 24,
    },
    backgroundContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
        flexDirection: 'column', // Stack items vertically
    },
    backgroundTop: {
        minHeight: 10,
        maxHeight: 99,
        width: '100%',
    },
    backgroundBottom: {
        flexGrow: 1, // Grow proportionally, twice the rate of the top section
        width: '100%',
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'flex-start',
        paddingStart: 20,
        zIndex: 1,
    },
    title: {
        textAlign: 'left',
        marginBottom: 16,
        flexWrap: 'wrap',
    },
    description: {
        textAlign: 'left',
        color: Colors.textSecondary,
        marginBottom: 16,
    },
    header: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    footer: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 20,
    },
    paginationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.textSecondary,
        marginHorizontal: 4,
    },
    paginationDotActive: {
        backgroundColor: Colors.primary,
        width: 20,
    },
    button: {
        borderWidth: 1,
        borderColor: '#000',
        borderRadius: 25,
        backgroundColor: Colors.backgroundDefault,
        paddingVertical: 10,
        paddingHorizontal: 20,
        alignSelf: 'center',
        marginBottom: 20,
        width: '100%',
    },
    buttonLabel: {
        color: Colors.dark,
    }
});

export default IntroScreen; 