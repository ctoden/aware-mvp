import { StyleSheet, Platform } from 'react-native';
import { customColors } from '@app/constants/theme';
import { Spacings } from 'react-native-ui-lib';
import { FLEX_KEY_PATTERN } from 'react-native-ui-lib/src/commons/modifiers';

export interface TextUIProps {
    children: React.ReactNode | string;
    noMargins?: boolean;
    noPadding?: boolean;
    color?: string;
    shadow?: boolean;
    center?: boolean;
}

export const styles = StyleSheet.create({
    H1: {
        display: 'flex',
        alignItems: 'flex-start',
        fontSize: 48,
        fontFamily: 'WorkSansBlack',
        fontWeight: '900',
        lineHeight: 44,
        letterSpacing: -0.96,
        width: '100%',
        paddingVertical: Spacings.s4,
    },
    H2: {
        display: 'flex',
        alignItems: 'flex-start',
        fontSize: 24,
        fontFamily: 'WorkSansSemiBold',
        fontWeight: '600',
        lineHeight: 30,
        letterSpacing: -0.96,
        width: '100%',
    },
    H3: {
        display: 'flex',
        alignItems: 'flex-start',
        fontSize: 16,
        fontFamily: 'WorkSansSemiBold',
        fontWeight: '600',
        lineHeight: 20,
        letterSpacing: -0.96,
        width: '100%',
    },
    H4: {
        display: 'flex',
        alignItems: 'flex-start',
        fontSize: 16,
        fontFamily: 'WorkSansSemiBold',
        fontWeight: '600',
        lineHeight: 20,
        letterSpacing: -0.96,
        width: '100%',
    },
    BodyRegular: {
        display: 'flex',
        alignItems: Platform.OS === 'ios' ? 'center' : 'flex-start',
        fontSize: Platform.OS === 'ios' ? 14 : 16,
        fontFamily: 'WorkSans',
        fontWeight: '400',
        lineHeight: Platform.OS === 'ios' ? 20 : 24,
        letterSpacing: -0.24,
        width: '100%',
        marginVertical: Spacings.s4,
        height: '100%',
        textAlign: Platform.OS === 'ios' ? 'center' : 'left',
    },
    BodyTiny: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        fontSize: 12,
        fontFamily: 'WorkSans',
        fontWeight: '400',
        lineHeight: 18,
        letterSpacing: -0.96,
        width: '100%',
    },
    ButtonRegular: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: Platform.OS === 'ios' ? 14 : 16,
        fontFamily: 'WorkSansSemiBold',
        fontWeight: '600',
        lineHeight: Platform.OS === 'ios' ? 18 : 20,
        letterSpacing: -0.24
    },
    ButtonTiny: {
        display: 'flex',
        alignItems: 'flex-start',
        fontSize: 12,
        fontFamily: 'WorkSansSemiBold',
        fontWeight: '600',
        lineHeight: 18,
        letterSpacing: 0,
        width: '100%'
    },
    LinkRegular: {
        display: 'flex',
        alignItems: 'flex-start',
        fontSize: 16,
        fontFamily: 'WorkSans',
        fontWeight: '400',
        lineHeight: 24,
        letterSpacing: -0.96,
        textDecorationColor: 'underline',
        width: '100%'
    },
    LinkTiny: {
        display: 'flex',
        alignItems: 'flex-start',
        fontSize: 12,
        fontFamily: 'WorkSansMedium',
        fontWeight: '500',
        lineHeight: 18,
        letterSpacing: 0,
        textDecorationColor: 'underline',
        width: '100%'
    },
    Label: {
        display: 'flex',
        alignItems: 'flex-start',
        fontSize: Platform.OS === 'ios' ? 10 : 12,
        fontFamily: 'WorkSans',
        fontWeight: '400',
        lineHeight: Platform.OS === 'ios' ? 14 : 18,
        letterSpacing: -0.12,
        width: '100%',
        marginBottom: Platform.OS === 'ios' ? 2 : 4
    },
    Title: {
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        fontSize: 64,
        fontFamily: 'WorkSansBlack',
        fontWeight: '900',
        letterSpacing: -0.96,
        width: '100%',
    }
})

export const assessmentStyles = StyleSheet.create({
    scrollView: {
        flex: 1,
        backgroundColor: '#FAF9F6',
        padding: 20,
    },
    submitButton: {
        backgroundColor: customColors.black1,
        width: '100%',
        padding: 16,
        borderRadius: 24,
    },
    submitButtonDisabled: {
        backgroundColor: '#E0E0E0',
    },
    submitButtonText: {
        color: '#FFF',
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '500',
        textTransform: 'capitalize',
    },
    submitButtonTextDisabled: {
        color: '#999',
    },
    resetButton: {
        backgroundColor: customColors.white,
        width: '100%',
        padding: 16,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: customColors.black1
    },
    resetButtonText: {
        color: customColors.black1,
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '500',
        textTransform: 'capitalize',
    },
    uploadsContainer: {
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
    },
    uploadsTitle: {
        fontSize: 16,
        marginBottom: 8,
    },
    uploadDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
    },
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderStyle: 'dashed',
        borderRadius: 8,
    },
    uploadButtonText: {
        fontSize: 14,
        color: '#000',
    },
    uploadItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FAF9F6',
        padding: 16,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: customColors.beige3,
        marginBottom: 12,
    },
    uploadText: {
        fontSize: 14,
        color: customColors.black1,
    },
    uploadMoreButton: {
        alignItems: 'center',
        marginTop: 8,
    },
    uploadMoreText: {
        color: customColors.black1,
        textDecorationLine: 'underline',
        fontSize: 14,
    },
    pillGroup: {
        flexDirection: 'row',
        position: 'relative',
        width: '100%',
        marginBottom: 12,
    },
    pill: {
        flex: 1,
        backgroundColor: customColors.beige2Alpha60,
        padding: Platform.OS === 'ios' ? 12 : 16,
        borderRadius: 100,
        height: Platform.OS === 'ios' ? 44 : 'auto',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pillLeft: {
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
        borderRightWidth: 0,
    },
    pillRight: {
        borderTopLeftRadius: 0,
        borderBottomLeftRadius: 0,
        borderLeftWidth: 0,
    },
    pillSelected: {
        backgroundColor: customColors.beige2,
        borderColor: '#000',
    },
    pillText: {
        textAlign: 'center',
        fontSize: Platform.OS === 'ios' ? 14 : 16,
        color: customColors.black1,
        display: 'flex',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    pillTextSelected: {
        color: '#FFF',
    },
    pillDivider: {
        width: 1,
        zIndex: 1,
        backgroundColor: customColors.black3,
        position: 'absolute',
        left: '50%',
        top: '20%',
        height: '60%',
        transform: [{ translateX: -0.5 }]
    },
    myDataButtonsContainer: {
        flexDirection: 'column',
        gap: 12,
        alignItems: 'center',
    },
});

export const FTUX = StyleSheet.create({
    bottomContainer: {
        position: 'relative',
        marginVertical: 36,
        marginHorizontal: 20,
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 16,
    }
})