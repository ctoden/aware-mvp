import * as React from 'react';
import { render } from '@testing-library/react-native';
import { TypingIndicator } from '../TypingIndicator';

describe('TypingIndicator', () => {
    it('renders when visible', () => {
        const result = render(<TypingIndicator isVisible={true} />);
        expect(result.toJSON()).toBeTruthy();
    });

    it('does not render when not visible', () => {
        const result = render(<TypingIndicator isVisible={false} />);
        expect(result.toJSON()).toBeNull();
    });
});