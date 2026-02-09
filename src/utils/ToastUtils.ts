import Toast from 'react-native-toast-message';

export function showErrorToast(title: string, message?: string): void {
    Toast.show({
        type: 'error',
        text1: title,
        text2: message,
        position: 'bottom',
        visibilityTime: 3000,
    });
}

export function showSuccessToast(title: string, message?: string): void {
    Toast.show({
        type: 'success',
        text1: title,
        text2: message,
        position: 'bottom',
        visibilityTime: 2000,
    });
} 