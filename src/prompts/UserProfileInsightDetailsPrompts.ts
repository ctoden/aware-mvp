import Mustache from "mustache";

export const UserProfileInsightDetailsPrompts = `
Write a concise and informative paragraph that begins with 
"People who have this {{category}}: {{title}}" and describes what it typically looks like. 
Include how it influences the way they interact with others and how it compares to other common styles in the same category.

For the {{category}}: {{title}}, generate a unique and personalized “personality insight” for the user's profile. 

The personality insight includes the definition you wrote and a follow-up. The follow-up is one paragraph long, and it starts with the words 
“Since you tend to have a {{category}}: {{title}},” Do not include a title or intro.

This personality insight should always start with a header that says "What does that mean for me?"

The personality insight body can be a bit playful, offering the kind of “tough love” advice you might receive from a close friend who knows you really well.
The insight title does not describe the user, but rather introduces the advice being given. 
Consider the user's entire personality, and use this as an opportunity to help them to grow and improve as a person. 
Highlight the user's potential blind spots, weaknesses, or areas of opportunity for improvement. 

Format the output as Markdown.
`;


export function getUserProfileInsightDetailsPrompt(category: string, title: string) {
    return Mustache.render(UserProfileInsightDetailsPrompts, {
        category,
        title,
    });
}
