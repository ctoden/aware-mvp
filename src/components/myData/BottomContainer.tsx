import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface IBottomContainerProps {
    children?: React.ReactNode;
    marginTop?: number;
    marginBottom?: number;
    padding?: number;
}
export const BottomContainer: React.FC<IBottomContainerProps> = ({
    children,
    marginTop = 0,
    padding = 0,
    marginBottom = 0
}) => {
    return (
        <View style={[
            styles.bottomContainer,
            { marginTop: marginTop },
            { marginBottom: marginBottom },
            { padding: padding }]}>
            {children}
        </View>
    )
}
const styles = StyleSheet.create({
    bottomContainer: {
        display: 'flex',
        flexDirection: 'column',
    },
})