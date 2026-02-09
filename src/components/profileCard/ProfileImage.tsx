import React from 'react';
import { Text, View } from 'react-native-ui-lib';
import { StyleSheet } from 'react-native';

const ProfileImage: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <View>
            {children}
        </View>
    )
}
export default ProfileImage
const styles = StyleSheet.create({})