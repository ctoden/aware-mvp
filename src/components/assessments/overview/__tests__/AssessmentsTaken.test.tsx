import React from 'react';
import { render } from '@testing-library/react-native';
import { AssessmentsTaken } from '../AssessmentsTaken';
import { AssessmentData } from '../types';

describe('AssessmentsTaken', () => {
    it('renders correctly', () => {
        const assessments: AssessmentData[] = [
            { title: 'Myers Briggs (MBTI®)', value: 'ENTP' },
            { title: 'CliftonStrengths®', value: 'Competition, Stra...' },
            { title: 'Enneagream', value: '5w4' },
          ];

        const { getByText } = render(<AssessmentsTaken />);

        expect(getByText('Assessments')).toBeTruthy();
        expect(getByText('Add more assessments to gain deeper insight about your personality')).toBeTruthy();
        expect(getByText('Add an assessment')).toBeTruthy();
    });
});