import * as React from 'react';
import { StyleSheet } from 'react-native'; 
import { View, Text, Image } from 'react-native-ui-lib';
import { customColors } from '@app/constants/theme';
import { AssessmentCardProps } from './types';

export const AssessmentsTakenListCard: React.FC<AssessmentCardProps> = ({ assessment, isLast }) => {
    console.log("~~~~ AssessmentsTakenListCard assessment", assessment, isLast);
    return (
        <View flex width="100%" style={styles.cardContainer}>
            <View flex width="100%" style={styles.cardContent}>
                <View flex row width="100%" style={styles.textContainer}>
                    <View style={styles.titleContainer}>
                        <Text style={styles.titleText}>{assessment.title}</Text>
                    </View>
                    <View flex row right>
                        <View style={styles.valueContainer}>
                            <Text style={styles.valueText}>{assessment.value}</Text>
                        </View>

                        <Image
                            resizeMode="contain"
                            source={{ uri: "https://cdn.builder.io/api/v1/image/assets/49f9222b7d4543e099417d52e6a4eba4/a406d64b6d1a3f3883c8576869408a9a5d3f9d2542e3ff795312557de79f0aa9?apiKey=49f9222b7d4543e099417d52e6a4eba4&" }}
                            style={styles.dividerImage}
                        />
                    </View>
                </View>
            </View>
            {!isLast && (
                <View style={styles.divider} />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        alignItems: 'stretch',
        minHeight: 20,
    },
    cardContent: {
        paddingRight: 16,
        alignItems: 'center',
        gap: 16,
    },
    textContainer: {
        alignSelf: 'stretch',
        minWidth: 240,
        marginTop: 'auto',
        marginBottom: 'auto',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 1,
        flexBasis: '0%',
        
    },
    titleContainer: {
        flexBasis: "70%",
        alignSelf: 'stretch',
        marginTop: 'auto',
        marginBottom: 'auto',
    },
    titleText: {
        fontWeight: '600',
        lineHeight: 16,
        letterSpacing: -0.16,
    },
    valueContainer: {
        alignSelf: 'flex-end',
        marginTop: 'auto',
        marginBottom: 'auto',
        paddingRight: 10,
    },
    valueText: {
        textAlign: 'right',
        fontWeight: '400',
        letterSpacing: -0.24,
    },
    divider: {
        height: 1,
        minHeight: 1,
        backgroundColor: customColors.beige3,
        marginTop: 15,
        marginRight: 16,
    },
    dividerImage: {
        alignSelf: 'stretch',
        position: 'relative',
        display: 'flex',
        marginTop: 'auto',
        marginBottom: 'auto',
        width: 4,
        flexShrink: 0,
        aspectRatio: 0.5,
    },
    bottomImage: {
        position: 'relative',
        display: 'flex',
        marginTop: 16,
        width: '100%',
        aspectRatio: 333.33,
    },
});