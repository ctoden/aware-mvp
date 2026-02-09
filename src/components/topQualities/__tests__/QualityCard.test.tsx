import React from 'react';
import { render } from '@testing-library/react-native';
import { QualityCard } from '../QualityCard';

const mockQuality = {
    title: "Test Quality",
    level: "High",
    description: "Test description",
    color: "#000000",
    isHighLevel: true,
};

describe('QualityCard', () => {
    it('renders correctly', () => {
        const { getByText } = render(<QualityCard quality={mockQuality} />);
        expect(getByText('Test Quality')).toBeTruthy();
        expect(getByText('High')).toBeTruthy();
        expect(getByText('Test description')).toBeTruthy();
    });
});