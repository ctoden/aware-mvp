// jest.setup.js
import { NativeModules } from 'react-native';

NativeModules.StatusBarManager = { getHeight: jest.fn() };

// Add these new mock configurations
jest.mock('@expo/vector-icons', () => ({
    Ionicons: 'Ionicons-Mock',
}));

jest.mock('expo-font', () => ({
    loadAsync: jest.fn(() => Promise.resolve()),
    isLoaded: jest.fn(() => true),
    FontDisplay: {
        FALLBACK: 'fallback',
    },
}));

jest.mock('react-native/Libraries/Components/StatusBar/StatusBar', () => ({
    setBarStyle: jest.fn(),
    setHidden: jest.fn(),
    setBackgroundColor: jest.fn(),
    setTranslucent: jest.fn(),
    getHeight: jest.fn(() => 20),
    currentHeight: 20,
}));

// Mock expo-status-bar
jest.mock('expo-status-bar', () => ({
    StatusBar: () => 'StatusBar',
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);