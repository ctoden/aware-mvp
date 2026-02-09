import { customColors } from '@app/constants/theme';
import React from 'react'
import { StyleSheet, View } from 'react-native';
import PencilIcon from '../icons/PencilIcon';

const ProfileImageContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <View style={styles.profileImageContainer}>
            <View>
                {children}
            </View>
            <View style={styles.iconContainer}>
                <PencilIcon color={customColors.black1} style={styles.pencilIcon} />
            </View>
        </View>
    )
}
export default ProfileImageContainer;

const styles = StyleSheet.create({
    pencilIcon: {
        width: 24,
        height: 24,
        marginLeft: 8
    },
    iconContainer: {
        display: 'flex',
        flexGrow: 1
    },
    profileImageContainer: {
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: customColors.beige3,
        paddingLeft: 8,
        borderRadius: 24,
        width: 136,
        height: 96,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
    }
})