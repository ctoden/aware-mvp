import '@testing-library/jest-native/extend-expect';
import {jest} from '@jest/globals';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import {set} from 'lodash';
import { EventEmitter } from 'events';

// Enable experimental decorators support
import 'reflect-metadata';

import {SupabaseClient, Session, AuthChangeEvent, AuthResponse} from '@supabase/supabase-js';
import {DependencyService} from "@src/core/injection/DependencyService";
import {SUPABASE_CLIENT_KEY} from "@src/constants";

const observables: any = [];

// Create an event emitter for auth state changes
const authEventEmitter = new EventEmitter();

jest.mock('@legendapp/state/config/enableReactNativeComponents', () => ({
    enableReactNativeComponents: jest.fn()
}));

// Force environment to test
process.env.NODE_ENV = 'test';

// Read and set environment variables
const envPath = path.resolve(process.cwd(), '.env.test.local');
const envLocal = fs.readFileSync(envPath).toString();
const envConfig = dotenv.parse(envLocal);

set(global, 'test.env', envConfig);

// Set each environment variable
Object.entries(envConfig).forEach(([key, value]) => {
    process.env[key] = value;
});

const supabaseClient = new SupabaseClient('http://localhost', 'public-anon-key') as jest.Mocked<SupabaseClient>;

const __authCalled = jest.fn();

supabaseClient.auth = {
    test: "TEST",
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn<() => Promise<AuthResponse>>().mockResolvedValue({ data: {  user: null, session: null }, error: null }),
    startAutoRefresh: jest.fn(),
    stopAutoRefresh: jest.fn(),

    // Implement onAuthStateChange using EventEmitter
    onAuthStateChange: jest.fn((callback: (event: AuthChangeEvent, session: Session | null) => void) => {
        __authCalled(callback);

        authEventEmitter.on('AUTH_STATE_CHANGE', callback);

        return {
            data: {
                subscription: {
                    unsubscribe: () => {
                        authEventEmitter.off('AUTH_STATE_CHANGE', callback);
                    },
                },
            },
            error: null,
        };
    }),



    // Method to simulate auth state changes
    __simulateAuthStateChange: (event: AuthChangeEvent, session: Session | null) => {
        authEventEmitter.emit('AUTH_STATE_CHANGE', event, session);
    },
} as any;

DependencyService.registerValue(SUPABASE_CLIENT_KEY, supabaseClient);

// Now we can safely import and call enableReactNativeComponents
import {enableReactNativeComponents} from "@legendapp/state/config/enableReactNativeComponents";
enableReactNativeComponents();
