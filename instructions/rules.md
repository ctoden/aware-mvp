# Project Overview
We are developing a proof-of-concept (POC) personalized training application that processes personality assessments like
Myers-Briggs, Big Five, Love Languages, Enneagram, and others.

The system will use the assessments to provide personalized assistance towards the following goals:

- self-improvement
- career development
- relationship building
- spiritual growth

Part of that assistance is offering a chat interface where users can ask questions and get answers based on the assessments; the chatbot will use the assessments to provide personalized assistance.  The chatbot will also use the users 'Personality Scores' to provide more accurate and relevant answers, suggesting actions and resources that are tailored to the user's personality.


# Rules for technical implementation

App is built with TypeScript following SOLID principles. 
Use MVVM architecture with dumb models that only contain properties,
view models for business logic, and services for data operations. 
Keep models, views, view models, and services in
separate layers with clear interfaces. Attempt to keep your code as simple as possible.

- prefer using and extending React FC over class components or simple functions
- avoid the use of webpack
- avoid the use of redux
- use expo and react-native-web
- prefer legend-state over redux; DO not use redux in this project
- use jest-expo for testing
- use @testing-library/react-native for basic unit testing
- use playwright and supawrite for e2e testing
- use tsyringe for dependency injection
- use Mistral and OpenAI APIs for interactions with LLMs