import React from 'react';
import { render } from '@testing-library/react-native';
import { TopQualitiesList } from '../TopQualityList';

describe('TopQualitiesList', () => {
    it('renders correctly', () => {
        const { getByText } = render(<TopQualitiesList />);
        expect(getByText('Top qualities')).toBeTruthy();
        expect(getByText('View all qualities')).toBeTruthy();
    });

    it('renders all quality cards', () => {
        const { getByText } = render(<TopQualitiesList />);
        expect(getByText('Rationality')).toBeTruthy();
        expect(getByText('Openness')).toBeTruthy();
        expect(getByText('Honesty-Humility')).toBeTruthy();
        expect(getByText('Extraversion')).toBeTruthy();
    });
});