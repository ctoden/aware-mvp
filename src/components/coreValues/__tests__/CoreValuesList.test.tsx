import React from 'react';
import { render } from '@testing-library/react-native';
import { CoreValuesList } from '../CoreValuesList';
import { userCoreValues$, CoreValueType } from '@src/models/UserCoreValue';

describe('CoreValuesList', () => {
    beforeEach(() => {
        // Setup test data
        userCoreValues$.set({
            '1': {
                id: '1',
                user_id: 'test-user',
                title: 'Independence',
                description: 'You value autonomy and freedom',
                value_type: CoreValueType.SYSTEM_GENERATED,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            '2': {
                id: '2',
                user_id: 'test-user',
                title: 'Growth',
                description: 'You seek continuous improvement',
                value_type: CoreValueType.SYSTEM_GENERATED,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
        });
    });

    afterEach(() => {
        // Clean up
        userCoreValues$.set(null);
    });

    it('renders correctly', () => {
        const { getByText } = render(<CoreValuesList />);
        expect(getByText('Core values')).toBeTruthy();
    });

    it('renders all core value cards', () => {
        const { getByText } = render(<CoreValuesList />);
        expect(getByText('Independence')).toBeTruthy();
        expect(getByText('Growth')).toBeTruthy();
        expect(getByText('You value autonomy and freedom')).toBeTruthy();
        expect(getByText('You seek continuous improvement')).toBeTruthy();
    });
});