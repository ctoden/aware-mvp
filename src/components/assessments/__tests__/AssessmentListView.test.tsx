import React from 'react';
import { render } from '@testing-library/react-native';
import { AssessmentListView } from '../AssessmentListView';
import { userAssessments$ } from '@src/models/UserAssessment';

describe('AssessmentListView', () => {
  const mockAssessments = [
    {
      id: '1',
      user_id: 'user-1',
      name: 'Assessment 1',
      assessment_type: 'Type A',
      assessment_summary: 'Summary 1',
      assessment_full_text: 'Full text 1',
      created_at: '2024-01-19T00:00:00Z',
      updated_at: '2024-01-19T00:00:00Z'
    },
    {
      id: '2',
      user_id: 'user-1',
      name: 'Assessment 2',
      assessment_type: 'Type B',
      assessment_summary: 'Summary 2',
      assessment_full_text: 'Full text 2',
      created_at: '2024-01-19T00:00:00Z',
      updated_at: '2024-01-19T00:00:00Z'
    }
  ];

  beforeEach(() => {
    userAssessments$.set(mockAssessments);
  });

  it('renders list of assessments', () => {
    const { getByText } = render(<AssessmentListView />);

    // Verify that each assessment is rendered
    mockAssessments.forEach(assessment => {
      expect(getByText(assessment.name)).toBeTruthy();
      expect(getByText(assessment.assessment_type)).toBeTruthy();
      expect(getByText(assessment.assessment_summary!)).toBeTruthy();
    });
  });

  it('renders empty list when no assessments', () => {
    userAssessments$.set([]);
    const { toJSON } = render(<AssessmentListView />);
    
    // Verify that the component renders without crashing when empty
    expect(toJSON()).toBeTruthy();
  });
}); 