import React from 'react';
import { render } from '@testing-library/react-native';
import { MotivationsSimpleList } from '../MotivationsSimpleList';
import { userMotivations$ } from '@src/models/UserMotivation';
import { MotivationType } from '@src/models/UserMotivation';

describe('MotivationsSimpleList', () => {
    beforeEach(() => {
        // Reset the motivations state before each test
        userMotivations$.set(null);
    });

    it('renders empty list when no motivations', () => {
        const { getByText } = render(<MotivationsSimpleList />);
        expect(getByText('Motivations')).toBeTruthy();
    });

    it('renders motivations correctly', () => {
        // Setup test data
        const mockMotivations = {
            '1': {
                id: '1',
                user_id: 'test-user',
                title: 'Creative Expression',
                description: 'Driven by the desire to bring innovative ideas to life.',
                motivation_type: MotivationType.SYSTEM_GENERATED,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            '2': {
                id: '2',
                user_id: 'test-user',
                title: 'Personal Growth',
                description: 'Energized by continuous learning and self-improvement.',
                motivation_type: MotivationType.SYSTEM_GENERATED,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
        };

        userMotivations$.set(mockMotivations);

        const { getByText } = render(<MotivationsSimpleList />);

        // Verify the heading and motivations are rendered
        expect(getByText('Motivations')).toBeTruthy();
        expect(getByText('Creative Expression')).toBeTruthy();
        expect(getByText('Driven by the desire to bring innovative ideas to life.')).toBeTruthy();
        expect(getByText('Personal Growth')).toBeTruthy();
        expect(getByText('Energized by continuous learning and self-improvement.')).toBeTruthy();
    });

    it('updates when motivations change', () => {
        const { getByText, rerender } = render(<MotivationsSimpleList />);

        // Initially no motivations
        expect(getByText('Motivations')).toBeTruthy();

        // Add a motivation
        userMotivations$.set({
            '1': {
                id: '1',
                user_id: 'test-user',
                title: 'Achievement',
                description: 'Motivated by setting and reaching ambitious goals.',
                motivation_type: MotivationType.SYSTEM_GENERATED,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
        });

        rerender(<MotivationsSimpleList />);

        // Verify the new motivation is rendered
        expect(getByText('Achievement')).toBeTruthy();
        expect(getByText('Motivated by setting and reaching ambitious goals.')).toBeTruthy();
    });
}); 