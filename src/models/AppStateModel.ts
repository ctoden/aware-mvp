import { observable } from '@legendapp/state';
import { AppStateStatus } from 'react-native';

export const appState$ = observable<AppStateStatus>('active'); 