import { customAlphabet } from 'nanoid';

// Define the alphabet to include hexadecimal characters
const hexAlphabet = '0123456789abcdef';

// Create a nanoid generator function with the desired length
const nanoid = customAlphabet(hexAlphabet, 32);

export function generateUUID(): string {
    // Generate a 32-character ID
    const id = nanoid();
    // Insert hyphens to match the UUID format
    return `${id.slice(0, 8)}-${id.slice(8, 12)}-${id.slice(12, 16)}-${id.slice(16, 20)}-${id.slice(20)}`;
}