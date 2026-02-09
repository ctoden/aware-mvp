import { Result, ok, err } from 'neverthrow';

/**
 * Compares two PostgreSQL timestamps (in ISO 8601 format).
 * Returns a Result containing:
 * - negative number if timestamp1 is earlier than timestamp2
 * - 0 if timestamps are equal
 * - positive number if timestamp1 is later than timestamp2
 * 
 * @param timestamp1 First timestamp to compare (can be null/undefined)
 * @param timestamp2 Second timestamp to compare (can be null/undefined)
 * @returns Result<number, Error> where number is the comparison result
 */
export function compareTimestamps(
    timestamp1: string | null | undefined,
    timestamp2: string | null | undefined
): Result<number, Error> {
    try {
        // Handle null/undefined cases
        if (!timestamp1 && !timestamp2) return ok(0);
        if (!timestamp1) return ok(-1);
        if (!timestamp2) return ok(1);

        // Parse timestamps
        const date1 = new Date(timestamp1);
        const date2 = new Date(timestamp2);

        // Validate parsed dates
        if (isNaN(date1.getTime())) {
            return err(new Error(`Invalid timestamp format for timestamp1: ${timestamp1}`));
        }
        if (isNaN(date2.getTime())) {
            return err(new Error(`Invalid timestamp format for timestamp2: ${timestamp2}`));
        }

        return ok(date1.getTime() - date2.getTime());
    } catch (error) {
        return err(error instanceof Error ? error : new Error('Unknown error comparing timestamps'));
    }
} 