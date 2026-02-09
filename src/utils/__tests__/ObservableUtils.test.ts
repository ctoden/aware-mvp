import { ObservableObject, observable } from '@legendapp/state';
import { safelyClearObservable, safelyClearObservables } from '../ObservableUtils';

describe('ObservableUtils', () => {
    describe('safelyClearObservable', () => {
        it('should clear an observable with the correct default value', () => {
            // Arrange
            const testObservable = observable({ value: 'test' });
            const defaultValue = { value: '' };
            
            // Act - need to directly call the set method for testing
            safelyClearObservable(testObservable, defaultValue);
            
            // Assert
            expect(testObservable.get()).toEqual(defaultValue);
        });
        
        it('should handle null default values', () => {
            // Arrange
            const testObservable = observable('test');
            
            // Act
            safelyClearObservable(testObservable, null);
            
            // Assert
            expect(testObservable.get()).toBeNull();
        });
        
        it('should handle array default values', () => {
            // Arrange
            const testObservable = observable(['item1', 'item2']);
            
            // Act
            safelyClearObservable(testObservable, []);
            
            // Assert
            expect(testObservable.get()).toEqual([]);
        });
        
        it('should not throw when observable.set throws', () => {
            // Arrange
            const mockObservable = {
                set: jest.fn().mockImplementation(() => {
                    throw new Error('Test error');
                })
            };
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            
            // Act & Assert
            expect(() => {
                // @ts-ignore - Mock object for testing
                safelyClearObservable(mockObservable, null, 'testLabel');
            }).not.toThrow();
            
            expect(consoleSpy).toHaveBeenCalledWith(
                'Failed to clear observable testLabel:',
                expect.any(Error)
            );
            
            // Clean up
            consoleSpy.mockRestore();
        });
    });
    
    describe('safelyClearObservables', () => {
        it('should clear multiple observables with their respective default values', () => {
            // Arrange
            const stringObservable = observable('string value');
            const numberObservable = observable(123);
            const objectObservable = observable({ key: 'value' });
            const arrayObservable = observable([1, 2, 3]);
            
            // Act
            safelyClearObservables([
                { observable: stringObservable, defaultValue: '' },
                { observable: numberObservable, defaultValue: 0 },
                { observable: objectObservable, defaultValue: {} },
                { observable: arrayObservable, defaultValue: [] }
            ]);
            
            // Assert
            expect(stringObservable.get()).toBe('');
            expect(numberObservable.get()).toBe(0);
            expect(objectObservable.get()).toEqual({});
            expect(arrayObservable.get()).toEqual([]);
        });
        
        it('should handle errors in one observable without affecting others', () => {
            // Arrange
            const goodObservable1 = observable('value1');
            const goodObservable2 = observable('value2');
            const mockBadObservable = {
                set: jest.fn().mockImplementation(() => {
                    throw new Error('Test error');
                })
            };
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            
            // Act
            safelyClearObservables([
                { observable: goodObservable1, defaultValue: '', label: 'good1' },
                // @ts-ignore - Mock object for testing
                { observable: mockBadObservable, defaultValue: null, label: 'bad' },
                { observable: goodObservable2, defaultValue: '', label: 'good2' }
            ]);
            
            // Assert
            expect(goodObservable1.get()).toBe('');
            expect(goodObservable2.get()).toBe('');
            expect(consoleSpy).toHaveBeenCalledWith(
                'Failed to clear observable bad:',
                expect.any(Error)
            );
            
            // Clean up
            consoleSpy.mockRestore();
        });
    });
});