# RadialQualityGradient Component

A reusable component that visualizes a user's top qualities from their personality assessment as a radial gradient.

## Overview

The RadialQualityGradient component creates a circular visualization of a user's top three personality qualities. The highest-ranking quality's color is placed in the center, with the second and third highest qualities forming the middle and outer rings of the gradient.

## Usage

### Basic Component

```tsx
import RadialQualityGradient from '@src/components/RadialQualityGradient';
import { IUserTopQuality } from '@src/models/UserTopQuality';

// Sample qualities
const qualities: IUserTopQuality[] = [
  {
    title: 'Openness',
    level: 'High',
    description: 'You are curious and open to new experiences.',
    score: 85,
    color: ''
  },
  // ...more qualities
];

// Render the component
<RadialQualityGradient 
  qualities={qualities} 
  size={150} 
/>
```

### With ViewModel

To use the component with the MVVM architecture pattern:

```tsx
import RadialQualityGradientView from '@src/components/topQualities/RadialQualityGradientView';

// Render the view component that handles the ViewModel connection
<RadialQualityGradientView 
  size={200}
  showLegend={true}
/>
```

## Props

### RadialQualityGradient Component

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| `qualities` | `IUserTopQuality[]` | Array of user qualities to visualize | Required |
| `size` | `number` | Diameter of the gradient circle | `100` |
| `style` | `ViewStyle` | Additional styles for the container | `undefined` |
| `testID` | `string` | Test ID for testing | `undefined` |

### RadialQualityGradientView Component

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| `size` | `number` | Diameter of the gradient circle | `150` |
| `showLegend` | `boolean` | Whether to show a legend of top qualities | `true` |
| `onPress` | `() => void` | Callback for when the gradient is pressed | `undefined` |

## Color Mapping

The component maps quality titles to colors defined in the theme's `topQualityColors` object:

- Extraversion: `extraverted`
- Emotional Stability: `emotionalStability`
- Agreeableness: `agreeableness`
- Spirituality: `spirituality`
- Openness: `openness`
- Rationality: `rationality`
- Conscientiousness: `conscientiousness`
- Honesty-Humility: `honestyHumility`

## Testing

Use the test component at `app/tests/RadialGradientTest.tsx` to see the component in action. 