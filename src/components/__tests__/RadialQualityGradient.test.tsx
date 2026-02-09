import React from 'react';
import { render } from '@testing-library/react-native';
import { RadialQualityGradient } from '../RadialQualityGradient';
import { IUserTopQuality } from '@src/models/UserTopQuality';

// Mock the Svg components
jest.mock('react-native-svg', () => {
  const MockSvg = ({ children }: { children: React.ReactNode }) => <>{children}</>;
  MockSvg.Defs = ({ children }: { children: React.ReactNode }) => <>{children}</>;
  MockSvg.RadialGradient = ({ children }: { children: React.ReactNode }) => <>{children}</>;
  MockSvg.Stop = () => null;
  MockSvg.Circle = () => null;
  return MockSvg;
});

describe('RadialQualityGradient', () => {
  // Sample test data
  const testQualities: IUserTopQuality[] = [
    {
      title: 'Openness',
      level: 'High',
      description: 'You are curious and open to new experiences.',
      score: 85,
      color: ''
    },
    {
      title: 'Conscientiousness',
      level: 'High',
      description: 'You are organized and goal-oriented.',
      score: 78,
      color: ''
    },
    {
      title: 'Extraversion',
      level: 'Medium',
      description: 'You are moderately outgoing and sociable.',
      score: 65,
      color: ''
    }
  ];

  it('renders without crashing', () => {
    const { toJSON } = render(
      <RadialQualityGradient qualities={testQualities} />
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders with custom size', () => {
    const { getByTestId } = render(
      <RadialQualityGradient 
        qualities={testQualities} 
        size={200}
        testID="radial-gradient" 
      />
    );
    
    // Cannot directly test the size props in a mocked component
    // But we can verify the component rendered
    expect(getByTestId('radial-gradient')).toBeTruthy();
  });

  it('renders a fallback when not enough qualities provided', () => {
    const { toJSON } = render(
      <RadialQualityGradient qualities={[testQualities[0]]} />
    );
    expect(toJSON()).toBeTruthy();
  });
}); 