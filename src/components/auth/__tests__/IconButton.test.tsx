import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { IconButton } from '../IconButton';

describe('IconButton', () => {
    const mockOnPress = jest.fn();
    const defaultProps = {
        icon: 'test-icon-url',
        onPress: mockOnPress,
    };

    it('renders correctly', () => {
        const { getByRole } = render(<IconButton {...defaultProps} />);
        expect(getByRole('button')).toBeTruthy();
    });

    it('calls onPress when pressed', () => {
        const { getByRole } = render(<IconButton {...defaultProps} />);
        fireEvent.press(getByRole('button'));
        expect(mockOnPress).toHaveBeenCalled();
    });
});