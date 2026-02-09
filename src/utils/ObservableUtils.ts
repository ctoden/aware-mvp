import { Observable } from '@legendapp/state';

/**
 * Type-safe utility to clear an observable with the appropriate default value
 * @param observable The observable to clear
 * @param defaultValue The default value to set (null, [], {}, etc.)
 * @param label Optional label for logging purposes
 */
export function safelyClearObservable<T>(observable: Observable<T>, defaultValue: T, label?: string): void {
    try {
        // LegendState observables have a set method
        // @ts-ignore - We know observable has a set method
        observable.set(defaultValue);
    } catch (e) {
        console.warn(`Failed to clear observable${label ? ` ${label}` : ''}:`, e);
    }
}

/**
 * Safely clears multiple observables at once
 * @param observablesMap Map of observables with their default values and optional labels
 */
export function safelyClearObservables(
    observablesMap: Array<{
        observable: Observable<any>;
        defaultValue: any;
        label?: string;
    }>
): void {
    observablesMap.forEach(({ observable, defaultValue, label }) => {
        safelyClearObservable(observable, defaultValue, label);
    });
}