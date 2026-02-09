import { AssessmentHandlerRegistry } from '../AssessmentHandlerRegistry';
import { IAssessmentHandler } from '../AssessmentHandler';
import { err, ok, Result } from 'neverthrow';

// Mock assessment handler for testing
class MockAssessmentHandler implements IAssessmentHandler {
    readonly assessmentType = 'MOCK';

    async generateSummary(): Promise<Result<string, Error>> {
        return ok('Mock summary');
    }

    async generateDetailedSummary(): Promise<Result<string, Error>> {
        return ok('Mock detailed summary');
    }
}

describe('AssessmentHandlerRegistry', () => {
    let registry: AssessmentHandlerRegistry;
    let mockHandler: MockAssessmentHandler;

    beforeEach(async () => {
        registry = new AssessmentHandlerRegistry();
        await registry.initialize();
        mockHandler = new MockAssessmentHandler();
    });

    afterEach(async () => {
        await registry.end();
    });

    describe('registerHandler', () => {
        it('should register a handler successfully', () => {
            // Act
            registry.registerHandler(mockHandler);

            // Assert
            const types = registry.getSupportedTypes();
            expect(types).toContain('mock');
        });

        it('should register multiple handlers', () => {
            // Arrange
            const mockHandler2 = new MockAssessmentHandler();
            Object.defineProperty(mockHandler2, 'assessmentType', { value: 'MOCK2' });

            // Act
            registry.registerHandler(mockHandler);
            registry.registerHandler(mockHandler2);

            // Assert
            const types = registry.getSupportedTypes();
            expect(types).toContain('mock');
            expect(types).toContain('mock2');
            expect(types.length).toBe(2);
        });
    });

    describe('getHandler', () => {
        it('should return registered handler', () => {
            // Arrange
            registry.registerHandler(mockHandler);

            // Act
            const result = registry.getHandler('MOCK');

            // Assert
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toBe(mockHandler);
            }
        });

        it('should return error for unregistered handler', () => {
            // Act
            const result = registry.getHandler('NONEXISTENT');

            // Assert
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toContain('No handler found');
            }
        });

        it('should be case insensitive', () => {
            // Arrange
            registry.registerHandler(mockHandler);

            // Act
            const result = registry.getHandler('mock');

            // Assert
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toBe(mockHandler);
            }
        });
    });

    describe('getSupportedTypes', () => {
        it('should return empty array when no handlers registered', () => {
            // Act
            const types = registry.getSupportedTypes();

            // Assert
            expect(types).toEqual([]);
        });

        it('should return all registered handler types', () => {
            // Arrange
            const mockHandler2 = new MockAssessmentHandler();
            Object.defineProperty(mockHandler2, 'assessmentType', { value: 'MOCK2' });
            registry.registerHandler(mockHandler);
            registry.registerHandler(mockHandler2);

            // Act
            const types = registry.getSupportedTypes();

            // Assert
            expect(types).toEqual(['mock', 'mock2']);
        });
    });
}); 