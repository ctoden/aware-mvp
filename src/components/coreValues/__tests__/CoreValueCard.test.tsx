import React from 'react';
import { render } from '@testing-library/react-native';
import { CoreValueCard } from '../CoreValueCard';

const mockCoreValue = {
    title: "Test Value",
    description: "Test description",
    iconUrl: "https://test.com/icon.png"
};

describe('QualityCard', () => {
    it('renders correctly', () => {
        const { getByText } = render(<CoreValueCard value={mockCoreValue} />);
        expect(getByText('Test Value')).toBeTruthy();
        expect(getByText('Test description')).toBeTruthy();
    });
});