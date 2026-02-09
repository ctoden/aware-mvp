import { StyleSheet } from 'react-native';
import { StyleProps } from './types';

export const createStyles = ({ hasError, disabled }: StyleProps) =>
    StyleSheet.create({
        container: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            opacity: disabled ? 0.5 : 1,
            width: '100%',
        },
        labelContainer: {
            display: 'flex',
            flexDirection: 'row',
            width: '100%',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
        },
        label: {
            color: '#545452',
            fontSize: 12,
            fontWeight: '400',
        },
        errorText: {
            color: '#C22900',
            fontSize: 12,
            fontWeight: '400',
        },
        input: {
            flex: 1,
            borderRadius: 24,
            borderWidth: 2,
            borderColor: hasError ? '#C22900' : '#545452',
            paddingHorizontal: 16,
            paddingVertical: 16,
            fontSize: 16,
            color: '#000000',
            backgroundColor: '#FFFFFF',
            letterSpacing: -0.24,
            width: '100%',
            minHeight: 56,
        },
    });