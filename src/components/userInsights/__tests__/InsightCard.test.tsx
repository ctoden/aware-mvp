import React from 'react';
import { render } from '@testing-library/react-native';
import { InsightCard } from '../InsightCard';
import { UserQuickInsight } from '@src/models/UserQuickInsightModel';
import { observable } from '@legendapp/state';

// Mock the router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock the RadialQualityGradientView component
jest.mock('@src/components/topQualities/RadialQualityGradientView', () => {
  return {
    __esModule: true,
    default: () => null, // Mock implementation
  };
});

describe('InsightCard', () => {
  const mockInsight: UserQuickInsight = {
    id: 'test-id',
    title: observable('Test Insight'),
    description: observable('Test Description'),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
});
