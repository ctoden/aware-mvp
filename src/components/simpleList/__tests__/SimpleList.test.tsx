import React from 'react';
import { render } from '@testing-library/react-native';
import { SimpleList } from '../SimpleList';

export const weaknessesData = [
    {
        title: "Procrastination",
        description: "You may struggle to prioritize tasks and manage your time effectively, leading to last-minute rushes or missed deadlines",
        iconUrl: "https://cdn.builder.io/api/v1/image/assets/49f9222b7d4543e099417d52e6a4eba4/3708cdaf4d2175101aa7a391e19dd733a06dede3773b3e581a04dda4656471e5?apiKey=49f9222b7d4543e099417d52e6a4eba4&",
    },
    {
        title: "Difficulty following through",
        description: "You may find it challenging to finish projects, especially if you lose interest or are not fully invested in the task",
        iconUrl: "https://cdn.builder.io/api/v1/image/assets/49f9222b7d4543e099417d52e6a4eba4/3708cdaf4d2175101aa7a391e19dd733a06dede3773b3e581a04dda4656471e5?apiKey=49f9222b7d4543e099417d52e6a4eba4&",
    },
    {
        title: "Over-intellectualizing",
        description: "You might have a tendency to over-analyze situations, which can lead to indecision or inaction",
        iconUrl: "https://cdn.builder.io/api/v1/image/assets/49f9222b7d4543e099417d52e6a4eba4/3708cdaf4d2175101aa7a391e19dd733a06dede3773b3e581a04dda4656471e5?apiKey=49f9222b7d4543e099417d52e6a4eba4&",
    },
    {
        title: "Insensitivity",
        description: "Your high Rationality might make you seem emotionally detached, potentially straining interpersonal relationships",
        iconUrl: "https://cdn.builder.io/api/v1/image/assets/49f9222b7d4543e099417d52e6a4eba4/3708cdaf4d2175101aa7a391e19dd733a06dede3773b3e581a04dda4656471e5?apiKey=49f9222b7d4543e099417d52e6a4eba4&",
    },
];

describe('SimpleList', () => {
    it('renders correctly', () => {
        const { getByText } = render(<SimpleList simpleListItems={weaknessesData} />);

        expect(getByText('Weaknesses')).toBeTruthy();
        expect(getByText('Procrastination')).toBeTruthy();
        expect(getByText('Difficulty following through')).toBeTruthy();
        expect(getByText('Over-intellectualizing')).toBeTruthy();
        expect(getByText('Insensitivity')).toBeTruthy();
    });
});