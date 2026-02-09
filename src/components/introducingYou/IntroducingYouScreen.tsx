import { AwareBall } from '@app/components/AwareBall';
import { customColors } from '@app/constants/theme';
import { useViewModel } from '@src/hooks/useViewModel';
import { ScreenRoutes } from "@src/models/NavigationModel";
import { IntroducingYouViewModel } from '@src/viewModels/IntroducingYouViewModel';
import { NavigationViewModel } from '@src/viewModels/NavigationViewModel';
import { router } from 'expo-router';
import React, { FC, useCallback } from 'react';
import { StyleSheet, AnimatableNumericValue, useWindowDimensions } from 'react-native';
import { Colors, Text, TouchableOpacity, View, Image } from 'react-native-ui-lib';
import { LoadingOverlay } from '@src/components/LoadingOverlay';
import { observer, useObservable } from '@legendapp/state/react';

const imageStep3 = require('@assets/images/intro/aware-ball-step3.png');

const size = { width: 643, height: 636 };

export const IntroducingYouScreen: FC = observer(() => {
    const { viewModel } = useViewModel(IntroducingYouViewModel);
    const { viewModel: navigationVM } = useViewModel(NavigationViewModel);
    
    const { width } = useWindowDimensions();
    const isLoading$ = useObservable(viewModel.isLoading$);

    const handleContinue = useCallback(async () => {
        const result = await viewModel.handleContinue();
        if (result.isErr()) {
            console.error('Error completing FTUX:', result.error);
            return;
        }

        // Mark the post-authentication FTUX flow as completed 
        // This is different from the intro flow that shows before authentication
        navigationVM.setFTUX(false);
        
        // Navigate to the main app screen
        router.push(navigationVM.getRouteFor(ScreenRoutes.Index));
    }, [navigationVM, viewModel]);

    return (
            <View flex padding-page style={{ backgroundColor: customColors.beige2 }}>
                <LoadingOverlay 
                    visible={isLoading$.get()} 
                    message="Generating your personalized profile..." 
                />
                <View style={[styles.ballContainer, { left: -size.width / 2.5 }]}>
                    <Image
                        source={imageStep3}
                        resizeMode="contain"
                    />
                </View>
                <View flex>
                    <View style={[styles.contentContainer, { paddingTop: size.height / 2.65 }]}>
                        <Text style={styles.heading}>Introducing:</Text>
                        <Text style={styles.heading}>you ✨</Text>
                        <Text style={styles.subheading}>Ready to see your personalized profile?</Text>
                    </View>

                    <View style={styles.bottomContainer}>
                        <TouchableOpacity
                            style={styles.continueButton}
                            onPress={handleContinue}
                            disabled={isLoading$.get()}
                        >
                            <Text style={styles.continueButtonText}>See profile</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
    );
});

const styles = StyleSheet.create({
    ballContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        transform: [
            { translateY: -50 as AnimatableNumericValue },
        ],
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'flex-start',
        gap: 16,
    },
    heading: {
        fontSize: 48,
        fontFamily: 'WorkSansBlack',
        lineHeight: 44,
        letterSpacing: -0.96,
        color: Colors.textPrimary,
    },
    subheading: {
        fontSize: 16,
        fontFamily: 'WorkSans',
        lineHeight: 24,
        letterSpacing: -0.3,
        color: Colors.textPrimary,
    },
    bottomContainer: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    continueButton: {
        backgroundColor: '#000',
        padding: 16,
        borderRadius: 24,
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    continueButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '500',
    },
});

export default IntroducingYouScreen; 