import * as React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DataItem } from './DataItem';
import { Spacings } from 'react-native-ui-lib';
import { customColors } from '@app/constants/theme';

interface DataSectionProps {
    title: string;
    data: Array<{
        title: string;
        value: string;
        isAddButton?: boolean;
        route?: string;
        onPress?: (item: any) => void;
    }>;
}

export const DataSection: React.FC<DataSectionProps> = ({ title, data }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <View style={styles.dataContainer}>
                {data.map((item, index) => (
                    <DataItem
                        key={index}
                        title={item.title}
                        value={item.value}
                        isAddButton={item.isAddButton}
                        isLast={index === data.length - 1}
                        route={item.route}
                        onPress={item.onPress}
                    />
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        display: 'flex',
        width: '100%',
        flexDirection: 'column',
        alignItems: 'stretch',
    },
    sectionTitle: {
        color: 'rgba(84, 84, 82, 1)',
        fontSize: 12,
        fontWeight: '400',
        letterSpacing: -0.12,
        textAlign: 'left',
        minWidth: '50%'
    },
    dataContainer: {
        borderRadius: 24,
        display: 'flex',
        marginTop: 8,
        width: '100%',
        paddingHorizontal: Spacings.s4,
        paddingVertical: Spacings.s4,
        flexDirection: 'column',
        backgroundColor: customColors.beige2,
    },
});