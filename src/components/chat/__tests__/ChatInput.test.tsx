import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ChatInput } from '../ChatInput';

describe('ChatInput', () => {
    it('renders correctly', () => {
        const onSend = jest.fn();
        const { getByPlaceholderText } = render(<ChatInput onSend={onSend} />);
        expect(getByPlaceholderText('Type a message')).toBeTruthy();
    });

    it('handles text input', () => {
        const onSend = jest.fn();
        const { getByPlaceholderText } = render(<ChatInput onSend={onSend} />);
        const input = getByPlaceholderText('Type a message');
        fireEvent.changeText(input, 'Hello');
        expect(input.props.value).toBe('Hello');
    });
});