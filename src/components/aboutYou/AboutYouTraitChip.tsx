import { StyleSheet } from 'react-native'
import React from 'react'
import { View, Text } from 'react-native-ui-lib';
import { Icon } from 'react-native-ui-lib'

interface IAboutYouTraitChipProps {
    title: string;
    color: string;
    Icon: React.FC<{ width?: number; height?: number; fill?: string }>;
}

const AboutYouTraitChip: React.FC<IAboutYouTraitChipProps> = ({ title, color, Icon }) => {
    return (
        <View row left>
            <View style={[styles.traitChipContainer, { backgroundColor: color }]} row left centerV>
                <Icon width={8} height={8} fill="#212120" />
                <Text style={styles.traitChipText}>{title}</Text>
            </View>
        </View>
    )
}

export default AboutYouTraitChip;

const styles = StyleSheet.create({
    traitChipContainer: {
        borderRadius: 40,
        paddingHorizontal: 8,
        paddingVertical: 4,
        gap: 8,
    },
    traitChipText: {
        fontSize: 12,
        fontFamily: 'WorkSansSemiBold',
        fontWeight: '600',
        letterSpacing: -0.16,
    }
})
