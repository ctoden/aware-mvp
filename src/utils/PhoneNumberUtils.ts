export function isValidPhoneNumber(phoneNumber: string): boolean {
    // Return false for empty/null/undefined values
    if (!phoneNumber || typeof phoneNumber !== 'string') {
        return false;
    }

    // Remove all spaces, dashes, parentheses and dots
    const cleanedNumber = phoneNumber.replace(/[\s\-\(\)\.']+/g, '');

    // Check if the cleaned number is empty
    if (cleanedNumber.length === 0) {
        return false;
    }

    // International format starting with + 
    // OR
    // Local format with optional area code
    const phoneRegex = /^(?:\+\d{1,3})?(?:\d{10}|\d{3}-\d{3}-\d{4}|\(\d{3}\)\d{3}-?\d{4})$/;

    // Test against regex after removing formatting characters
    return phoneRegex.test(cleanedNumber);
}
