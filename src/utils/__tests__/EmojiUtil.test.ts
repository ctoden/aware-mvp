import { hasEmoji, getEmoji } from '../EmojiUtils';

describe('Emoji Utils', () => {
    describe('hasEmoji', () => {
        // Test cases with emojis
        const textsWithEmojis = [
            'Hello 👋',
            'I love 🍕 and 🌮',
            '🎉 Celebration time',
            'Mixed content with 🎨'
        ];

        // Test cases without emojis
        const textsWithoutEmojis = [
            'Hello world',
            'Just text 123',
            'Plain text',
            ''
        ];

        textsWithEmojis.forEach(text => {
            it(`should detect emoji in: ${text}`, () => {
                expect(hasEmoji(text)).toBe(true);
            });
        });

        textsWithoutEmojis.forEach(text => {
            it(`should not detect emoji in: ${text}`, () => {
                console.log("text: ", text, "")
                expect(hasEmoji(text)).toBe(false);
            });
        });
    });

    describe('getEmoji', () => {
        it('should return the first emoji from text with single emoji', () => {
            expect(getEmoji('Hello 👋')).toBe('👋');
        });

        it('should return the first emoji from text with multiple emojis', () => {
            expect(getEmoji('I love 🍕 and 🌮')).toBe('🍕');
        });

        it('should return null for text without emojis', () => {
            expect(getEmoji('Hello world')).toBeNull();
        });

        it('should return null for empty string', () => {
            expect(getEmoji('')).toBeNull();
        });
    });
});