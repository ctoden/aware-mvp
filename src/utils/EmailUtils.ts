export function isValidEmail(email: string): boolean {
    // Updated regex to prevent:
    // 1. Local part starting with a dot
    // 2. Local part ending with a dot
    // 3. Consecutive dots in the local part
    const emailRegex = /^[^\s@.][^\s@]*(?:\.[^\s@]+)*@[^\s@]+\.[^\s@]+$/;
    const secondEmailRegex = new RegExp(
        "^(?=[a-zA-Z0-9@._%+-]{1,254}$)(?!.*\\.{2})" +
        "[a-zA-Z0-9_%+-](?:\\.?[a-zA-Z0-9_%+-])*@" +
        "(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\\.)+" +
        "[a-zA-Z]{2,}$"
    );
    // Check if the email is not empty and matches the regex pattern
    if (!email || typeof email !== 'string') {
        return false;
    }

    // Trim the email to remove any leading/trailing whitespace
    const trimmedEmail = email.trim();

    // Additional checks for more robust validation
    if (trimmedEmail.length > 254) {
        return false; // Email is too long
    }

    // Split the email into local part and domain
    const [localPart, domain] = trimmedEmail.split('@');

    if (!localPart || !domain) {
        return false;
    }

    // Check local part length
    if (localPart.length > 64) {
        return false; // Local part is too long
    }

    // Check domain format
    const domainParts = domain.split('.');
    if (domainParts.length < 2) {
        return false; // Domain must have at least one dot
    }

    const firstCheck = emailRegex.test(trimmedEmail);
    if (!firstCheck) {
        return false;
    }
    const secondCheck = secondEmailRegex.test(trimmedEmail);

    return secondCheck;
} 