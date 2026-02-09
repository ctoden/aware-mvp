import { compareTimestamps } from '../TimestampUtils';

describe('TimestampUtils', () => {
    describe('compareTimestamps', () => {
        it('should return 0 when both timestamps are null', () => {
            const result = compareTimestamps(null, null);
            expect(result.isOk()).toBe(true);
            expect(result._unsafeUnwrap()).toBe(0);
        });

        it('should return 0 when both timestamps are undefined', () => {
            const result = compareTimestamps(undefined, undefined);
            expect(result.isOk()).toBe(true);
            expect(result._unsafeUnwrap()).toBe(0);
        });

        it('should return -1 when first timestamp is null and second is valid', () => {
            const result = compareTimestamps(null, '2023-12-25T12:00:00Z');
            expect(result.isOk()).toBe(true);
            expect(result._unsafeUnwrap()).toBe(-1);
        });

        it('should return 1 when second timestamp is null and first is valid', () => {
            const result = compareTimestamps('2023-12-25T12:00:00Z', null);
            expect(result.isOk()).toBe(true);
            expect(result._unsafeUnwrap()).toBe(1);
        });

        it('should return negative when first timestamp is earlier', () => {
            const result = compareTimestamps('2023-12-25T12:00:00Z', '2023-12-25T13:00:00Z');
            expect(result.isOk()).toBe(true);
            expect(result._unsafeUnwrap()).toBeLessThan(0);
        });

        it('should return positive when first timestamp is later', () => {
            const result = compareTimestamps('2023-12-25T13:00:00Z', '2023-12-25T12:00:00Z');
            expect(result.isOk()).toBe(true);
            expect(result._unsafeUnwrap()).toBeGreaterThan(0);
        });

        it('should return 0 when timestamps are equal', () => {
            const timestamp = '2023-12-25T12:00:00Z';
            const result = compareTimestamps(timestamp, timestamp);
            expect(result.isOk()).toBe(true);
            expect(result._unsafeUnwrap()).toBe(0);
        });

        it('should return error for invalid first timestamp', () => {
            const result = compareTimestamps('invalid-date', '2023-12-25T12:00:00Z');
            expect(result.isErr()).toBe(true);
            expect(result._unsafeUnwrapErr().message).toContain('Invalid timestamp format');
        });

        it('should return error for invalid second timestamp', () => {
            const result = compareTimestamps('2023-12-25T12:00:00Z', 'invalid-date');
            expect(result.isErr()).toBe(true);
            expect(result._unsafeUnwrapErr().message).toContain('Invalid timestamp format');
        });

        it('should handle timestamps with different timezones', () => {
            const result = compareTimestamps('2023-12-25T12:00:00+01:00', '2023-12-25T11:00:00Z');
            expect(result.isOk()).toBe(true);
            expect(result._unsafeUnwrap()).toBe(0);
        });

        it('should handle timestamps from database', ()=> {
            let result = compareTimestamps('2025-01-03T00:25:49.358+00:00', '2025-01-03T02:32:11.118Z');
            expect(result.isOk()).toBe(true);
            expect(result._unsafeUnwrap()).toBeLessThan(0);


            result = compareTimestamps('2025-01-03T02:32:11.118Z', '2025-01-03T00:25:49.358+00:00');
            expect(result.isOk()).toBe(true);
            expect(result._unsafeUnwrap()).toBeGreaterThan(0);
        })
    });
}); 