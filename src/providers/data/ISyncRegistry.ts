import { Observable } from '@legendapp/state';

export interface SyncRegistration<T> {
    observable: Observable<T>;
    syncOptions: {
        persist?: { name: string };
        // Add any other options you want to pass to your custom sync function
    };
} 