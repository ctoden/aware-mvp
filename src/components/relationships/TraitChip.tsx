import * as React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TraitChipProps } from './types';

export const TraitChip: React.FC<TraitChipProps> = ({ label }) => (
    <View style={styles.traitChipContainer}>
        <Text style={styles.traitChipText}>{label}</Text>
    </View>
);

const styles = StyleSheet.create({
    traitChipContainer: {
        backgroundColor: '#FECF51',
        alignSelf: 'stretch',
        borderRadius: 40,
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 8,
    },
    traitChipText: {
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: -0.16,
    }
});