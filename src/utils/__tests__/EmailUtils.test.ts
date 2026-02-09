import {isValidEmail} from '../EmailUtils';

describe('Email Validation', () => {
    // Valid email test cases
    const validEmails = [
        'user@example.com',
        'firstname.lastname@example.com',
        'email@subdomain.example.com',
        'firstname+lastname@example.com',
        '1234567890@example.com',
        'email@example-one.com',
        '_______@example.com',
        'email@example.name',
        'email@example.museum',
        'email@example.co.jp',
    ];

    // Invalid email test cases
    const invalidEmails = [
        '',
        'email@123.123.123.123',
        'email@[123.123.123.123]',
        '"email"@example.com',
        'plainaddress',
        'input-email',
        '@example.com',
        'Joe Smith <email@example.com>',
        'email.example.com',
        'email@example@example.com',
        '.email@example.com',
        'email.@example.com',
        'email..email@example.com',
        'あいうえお@example.com',
        'email@example.com (Joe Smith)',
        'email@example',
        'email@-example.com',
        'email@example..com',
        ' ',
        null,
        undefined,
    ];

    // Test valid emails
    validEmails.forEach((email) => {
        it(`should validate valid email: ${email}`, () => {
            expect(isValidEmail(email)).toBe(true);
        });
    });

    // Test invalid emails
    invalidEmails.forEach((email) => {
        it(`should invalidate invalid email: ${email}`, () => {
            expect(isValidEmail(`${email}`)).toBe(false);
        });
    });

    // Additional specific test cases
    it('should handle emails with very long local part', () => {
        const longLocalPart = 'a'.repeat(65) + '@example.com';
        expect(isValidEmail(longLocalPart)).toBe(false);
    });

    it('should handle emails with very long total length', () => {
        const longEmail = 'a'.repeat(255) + '@example.com';
        expect(isValidEmail(longEmail)).toBe(false);
    });

    it('should trim whitespace from emails', () => {
        expect(isValidEmail('  user@example.com  ')).toBe(true);
    });
}); 