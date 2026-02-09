import { customColors } from '@app/constants/theme';
import { Avatar } from '../avatar/Avatar';
import { StyleSheet, Text, View, TouchableOpacity, Platform, useWindowDimensions } from 'react-native';
import { BodyRegular } from '../text/BodyRegular';
import { Ionicons } from '@expo/vector-icons';
import { Label } from '../text/Label';
import { useRouter } from 'expo-router';
import RadialQualityGradientView from '../topQualities/RadialQualityGradientView';
import { AvatarWithGradient } from './AvatarWithGradient';

interface ProfileCardProps {
    name: string;
    email: string;
    avatar: string;
}
export const ProfileCard: React.FC<ProfileCardProps> = ({ name, email, avatar }) => {
    const router = useRouter();
    const { width } = useWindowDimensions(); // Move hook to component level

    const handleArrowPress = () => {
        router.push('/Account');
    };

    // Create dynamic styles using the width
    const dynamicStyles = StyleSheet.create({
        userInfo: {
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            maxWidth: width - 128,
            overflow: 'hidden',
            flexGrow: 1
        }
    });

    return (
        <View style={styles.profileSection}>
            <Label>Account</Label>
            <View style={styles.profileCard}>
                <TouchableOpacity onPress={handleArrowPress} style={styles.profileCardButton}>
                    <View style={styles.profileInfo}>
                        <AvatarWithGradient avatar={avatar} />
                        <View style={[styles.userInfo]}>
                            <Text style={styles.userName}>{name}</Text>
                            {Platform.OS === 'ios' ? (
                                <Text style={styles.emailText}>{email}</Text>
                            ) : (
                                <BodyRegular noMargins noPadding>{email}</BodyRegular>
                            )}
                        </View>
                        <View style={styles.arrowWrapper}>
                            <Ionicons
                                name="chevron-forward"
                                size={14}
                                color="black"
                            />
                        </View>
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    profileSection: {
        marginTop: Platform.OS === 'ios' ? 4 : 20,
        marginBottom: Platform.OS === 'ios' ? 4 : 0,
    },
    profileCard: {
        backgroundColor: customColors.beige2,
        borderRadius: 24,
        marginTop: Platform.OS === 'ios' ? 4 : 8,
        padding: Platform.OS === 'ios' ? 8 : 16,
        paddingVertical: Platform.OS === 'ios' ? 10 : 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    profileCardButton: {
        width: '100%',
        padding: 0,
        margin: 0
    },
    profileInfo: {
        position: 'relative',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: Platform.OS === 'ios' ? 6 : 8,
    },
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
    userInfo: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        maxWidth: '60%',
        overflow: 'hidden',
        flexGrow: 1
    },
    userName: {
        color: '#212120',
        fontFamily: 'WorkSansSemiBold',
        fontWeight: '600',
        letterSpacing: -0.3,
        fontSize: 14,
        marginBottom: Platform.OS === 'ios' ? 2 : 4,
    },
    emailText: {
        color: '#212120',
        fontSize: 14,
        fontFamily: 'WorkSans',
        letterSpacing: -0.2,
    },
    limitTextWidth: {
        marginRight: 8
    },
    arrowWrapper: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: customColors.black1,
        width: 48,
        height: 48,
        marginRight: -15,
    }
});
