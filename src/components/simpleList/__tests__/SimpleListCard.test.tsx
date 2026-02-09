import React from 'react';
import { render } from '@testing-library/react-native';
import { SimpleListCard } from '../SimpleListCard';

describe('WeaknessItem', () => {
    const mockProps = {
        title: "Test Weakness",
        description: "Test Description",
        iconUrl: "http://test.com/icon",
    };

    it('renders correctly', () => {
        const { getByText } = render(<SimpleListCard {...mockProps} />);

        expect(getByText('Test Weakness')).toBeTruthy();
        expect(getByText('Test Description')).toBeTruthy();
    });
});