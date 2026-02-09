import * as React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { DataItemProps } from './types';
import { customColors } from '@app/constants/theme';
import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity } from 'react-native-ui-lib';
import { router } from 'expo-router';
import { NavigationViewModel } from '@src/viewModels/NavigationViewModel';
import { useViewModel } from '@src/hooks/useViewModel';

export const DataItem: React.FC<DataItemProps> = ({ title, value, isAddButton, isLast, route, onPress }) => {

    const { viewModel: navigationVM } = useViewModel(NavigationViewModel);

    const handleOnPress = () => {
        // If onPress exists, call it with item data
        if (onPress) {
            onPress({ title, value, isAddButton, route });
        }
        
        // Then navigate if route exists
        if (route) {
            router.push(`/${route}`);
        }
    }

    return (
        <View style={styles.container}>
            <View style={styles.contentWrapper}>
                <TouchableOpacity onPress={handleOnPress}>
                    <View style={styles.textContainer}>
                        <Text style={styles.title}>{title}</Text>
                        <Text 
                            style={[styles.value, isAddButton && styles.addButton]}
                            numberOfLines={2}
                            ellipsizeMode="tail"
                        >
                            {value.length > 75 ? `${value.substring(0, 75)}...` : value}
                        </Text>
                        <Ionicons
                            style={styles.dataItemArrow}
                            name="chevron-forward"
                            size={14}
                            color={customColors.black1} />
                    </View>
                </TouchableOpacity>
            </View>
            {
                !isLast && (
                    <View style={styles.divider} />
                )
            }
        </View >
    );
};

const styles = StyleSheet.create({
    container: {
        display: 'flex',
        flexWrap: 'nowrap',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        minHeight: 40,
    },
    contentWrapper: {
        flexGrow: 1,
        display: 'flex',
        width: '100%',
    },
    textContainer: {
        minWidth: 240,
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'space-between',
        flex: 1,
        flexDirection: 'row',
    },
    title: {
        display: 'flex',
        fontFamily: 'WorkSans',
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        fontWeight: '600',
        flexShrink: 1,
        letterSpacing: -0.16,
        fontSize: 16,
        color: customColors.black1,
        textAlign: 'left',
        flex: 0.4,
        marginRight: 8,
    },
    value: {
        fontWeight: '400',
        fontFamily: 'WorkSans',
        letterSpacing: -0.24,
        fontSize: 16,
        display: 'flex',
        flexGrow: 1,
        flexShrink: 1,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        color: customColors.black1,
        textAlign: 'right',
        flex: 0.6,
        marginRight: 10,
    },
    addButton: {
        borderRadius: 50,
        paddingHorizontal: 8,
        paddingVertical: 4,
        fontSize: 12,
    },
    dataItemArrow: {
        marginLeft: 16,
        paddingVertical: 8,
    },
    arrow: {
        alignSelf: 'stretch',
        width: 4,
        aspectRatio: 0.5,
    },
    divider: {
        height: 1,
        width: '100%',
        backgroundColor: Platform.OS === 'ios' ? customColors.beige3 : 'rgba(187, 178, 161, 0.5)',
        marginTop: 4,
        marginBottom: 4,
    },
});