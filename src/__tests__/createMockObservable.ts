// src/test-utils/createMockObservable.ts
import { observable, Observable } from "@legendapp/state";

export type MockObservable<T> = {
    get: jest.Mock<T>;
    set: jest.Mock<void>;
    onChange: jest.Mock;
    _internal$: Observable<T>;
};

export function createMockObservable<T>(initialValue: T): MockObservable<T> {
    const _internal$ = observable<T>(initialValue);

    return {
        get: jest.fn(() => _internal$.get()),
        // @ts-ignore
        set: jest.fn((val: T) => _internal$.set(val)),
        onChange: jest.fn((callback) => {
            const unsubscribe = _internal$.onChange(callback);
            return jest.fn(() => unsubscribe());
        }),
        _internal$,
    };
}