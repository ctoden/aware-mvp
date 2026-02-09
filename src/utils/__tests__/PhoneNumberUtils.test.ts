import { isValidPhoneNumber } from '../PhoneNumberUtils';

describe('PhoneNumberUtils', () => {
    describe('isValidPhoneNumber', () => {
        it('should return false for empty/null/undefined values', () => {
            expect(isValidPhoneNumber('')).toBe(false);
            expect(isValidPhoneNumber(null as any)).toBe(false); 
            expect(isValidPhoneNumber(undefined as any)).toBe(false);
        });

        it('should return false for non-string values', () => {
            expect(isValidPhoneNumber(123 as any)).toBe(false);
            expect(isValidPhoneNumber({} as any)).toBe(false);
            expect(isValidPhoneNumber([] as any)).toBe(false);
        });

        it('should return false for strings containing only formatting characters', () => {
            expect(isValidPhoneNumber('()')).toBe(false);
            expect(isValidPhoneNumber('--')).toBe(false);
            expect(isValidPhoneNumber('  ')).toBe(false);
            expect(isValidPhoneNumber('..')).toBe(false);
        });

        it('should validate international format numbers', () => {
            expect(isValidPhoneNumber('+12125551234')).toBe(true);
            expect(isValidPhoneNumber('+442071234567')).toBe(true);
            expect(isValidPhoneNumber('+61291234567')).toBe(true);
        });

        it('should validate local format numbers', () => {
            expect(isValidPhoneNumber('2125551234')).toBe(true);
            expect(isValidPhoneNumber('212-555-1234')).toBe(true);
            expect(isValidPhoneNumber('(212)555-1234')).toBe(true);
            expect(isValidPhoneNumber('(212)5551234')).toBe(true);
        });

        it('should handle various formatting characters', () => {
            expect(isValidPhoneNumber('(212) 555-1234')).toBe(true);
            expect(isValidPhoneNumber('212.555.1234')).toBe(true);
            expect(isValidPhoneNumber('212 555 1234')).toBe(true);
        });

        it('should return false for invalid phone numbers', () => {
            expect(isValidPhoneNumber('123')).toBe(false);
            expect(isValidPhoneNumber('12345')).toBe(false);
            expect(isValidPhoneNumber('123456789')).toBe(false);
            expect(isValidPhoneNumber('123456789012345')).toBe(false);
            expect(isValidPhoneNumber('abc1234567')).toBe(false);
            expect(isValidPhoneNumber('555-abcd')).toBe(false);
        });
    });
});
