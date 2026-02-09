import React from 'react';
import { render } from '@testing-library/react-native';
import { AssessmentsTakenListCard } from '../AssessmentsTakenListCard';

describe('AssessmentsTakenListCard', () => {
  it('renders assessment data correctly', () => {
    const mockAssessment = {
      title: 'Test Assessment',
      value: 'Test Value'
    };

    const { getByText } = render(<AssessmentsTakenListCard assessment={mockAssessment} />);
    
    expect(getByText('Test Assessment')).toBeTruthy();
    expect(getByText('Test Value')).toBeTruthy();
  });
});