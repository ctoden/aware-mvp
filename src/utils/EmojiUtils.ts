export function hasEmoji(text: string) {
    // This regex pattern matches emoji characters more precisely
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F100}-\u{1F1FF}\u{1F200}-\u{1F2FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}]/u;
    return emojiRegex.test(text);
}

export function getEmoji(text: string) {
    const emojiRegex = /[\p{Emoji}]/u;
    const emoji = text.match(emojiRegex);
    return emoji ? emoji[0] : null;
}
