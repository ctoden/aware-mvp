import React from 'react';
import { render } from '@testing-library/react-native';
import { AssessmentCard } from '../AssessmentCard';
import { UserAssessment } from '@src/models/UserAssessment';

describe('AssessmentCard', () => {
  const mockAssessment: UserAssessment = {
    id: '1',
    user_id: 'user-1',
    name: 'Test Assessment',
    assessment_type: 'Personality Test',
    assessment_summary: 'This is a test summary',
    assessment_full_text: 'Full assessment text',
    created_at: '2024-01-19T00:00:00Z',
    updated_at: '2024-01-19T00:00:00Z'
  };

  it('renders assessment data correctly', () => {
    const { getByText } = render(
      <AssessmentCard assessment={mockAssessment} />
    );

    // Verify that the main assessment information is displayed
    expect(getByText(mockAssessment.name)).toBeTruthy();
    expect(getByText(mockAssessment.assessment_type)).toBeTruthy();
    expect(getByText(mockAssessment.assessment_summary!)).toBeTruthy();
  });

  it('handles null assessment summary', () => {
    const assessmentWithNullSummary: UserAssessment = {
      ...mockAssessment,
      assessment_summary: null
    };

    const { getByText } = render(
      <AssessmentCard assessment={assessmentWithNullSummary} />
    );

    // Verify that the component renders without crashing when summary is null
    expect(getByText(assessmentWithNullSummary.name)).toBeTruthy();
    expect(getByText(assessmentWithNullSummary.assessment_type)).toBeTruthy();
  });
}); 