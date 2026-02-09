import { isEmpty } from 'lodash';

const EMOJI_PREFIX = 'emoji:';

/**
 * Creates an avatar URL for an emoji
 * @param emoji The emoji string to convert
 * @returns A URL string with the emoji prefix
 */
export function createEmojiAvatarUrl(emoji: string): string {
    return `${EMOJI_PREFIX}${emoji}`;
}

/**
 * Checks if an avatar URL is an emoji avatar
 * @param avatarUrl The avatar URL to check
 * @returns True if the avatar URL is an emoji avatar
 */
export function isEmojiAvatar(avatarUrl: string | null): boolean {
    return !!avatarUrl?.startsWith(EMOJI_PREFIX);
}

/**
 * Extracts the emoji from an emoji avatar URL
 * @param avatarUrl The avatar URL to extract from
 * @returns The emoji string or null if not an emoji avatar
 */
export function getEmojiFromAvatarUrl(avatarUrl: string | null): string | null {
    if (isEmpty(avatarUrl) || !isEmojiAvatar(avatarUrl)) {
        return null;
    }
    return avatarUrl!.substring(EMOJI_PREFIX.length);
}

/**
 * Gets the display value for an avatar URL
 * @param avatarUrl The avatar URL to get the display value for
 * @returns The emoji if it's an emoji avatar, otherwise returns the URL
 */
export function getAvatarDisplay(avatarUrl: string | null): string | null {
    if (!avatarUrl) return null;
    return isEmojiAvatar(avatarUrl) ? getEmojiFromAvatarUrl(avatarUrl) : avatarUrl;
} 