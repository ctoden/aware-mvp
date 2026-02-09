import React from 'react'
import { Platform, StyleSheet, View } from 'react-native'
import { Avatar } from '../avatar/Avatar';
import RadialQualityGradientView from '../topQualities/RadialQualityGradientView'

interface IAvatarWithGradientProps {
    avatar?: string
}

export const AvatarWithGradient: React.FC<IAvatarWithGradientProps> = ({ avatar }) => {
    return (
        <View style={styles.gradientContainer}>
            <View
                style={{
                    width: 80,
                    height: 80,
                    borderRadius: 90,
                    overflow: 'hidden',
                }}>
                <RadialQualityGradientView
                    size={80}
                    showLegend={false}
                />
            </View>
            <Avatar style={styles.avatarContainer} src={avatar || ''} />
        </View>
    )
}
const styles = StyleSheet.create({
    gradientContainer: {
        width: 80,
        height: 80,
        position: 'relative',
        top: 0,
        right: 0,
    },
    avatarContainer: {
        position: 'absolute',
        borderRadius: Platform.OS === 'ios' ? 25 : 40,
        width: 80,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        zIndex: 1,
    },
})
