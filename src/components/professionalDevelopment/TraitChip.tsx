import { customColors } from '@app/constants/theme';
import React from 'react';
import { StyleSheet } from 'react-native';
import { Text, View } from 'react-native-ui-lib';

interface TraitChipProps {
    text: string;
}

export const TraitChip: React.FC<TraitChipProps> = ({ text }) => {
    return (
        <View style={styles.chip}>
            <Text style={styles.text}>{text}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    chip: {
        backgroundColor: '#97B5F5',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginRight: 8,
        marginBottom: 8,
    },
    text: {
        color: customColors.black1,
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: -0.16,
    },
}); 