import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import RadialQualityGradient from '@src/components/RadialQualityGradient';
import { IUserTopQuality } from '@src/models/UserTopQuality';

// Sample data for demonstration
const sampleQualities: IUserTopQuality[] = [
  {
    title: 'Openness',
    level: 'High',
    description: 'You are curious and open to new experiences.',
    score: 85,
    color: ''  // The color will be assigned by the RadialQualityGradient component
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
  },
  {
    title: 'Agreeableness',
    level: 'High',
    description: 'You are compassionate and cooperative.',
    score: 82,
    color: ''
  },
  {
    title: 'Emotional Stability',
    level: 'Medium-High',
    description: 'You handle stress well and remain calm in most situations.',
    score: 75,
    color: ''
  }
];

export const RadialQualityGradientExample: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Top Qualities Signature</Text>
      
      <View style={styles.gradientContainer}>
        <RadialQualityGradient 
          qualities={sampleQualities} 
          size={200} 
        />
      </View>
      
      <View style={styles.legendContainer}>
        {sampleQualities
          .sort((a, b) => b.score - a.score)
          .slice(0, 3)
          .map((quality, index) => (
            <View key={quality.title} style={styles.legendItem}>
              <Text style={styles.legendRank}>{index + 1}.</Text>
              <Text style={styles.legendTitle}>{quality.title}</Text>
              <Text style={styles.legendScore}>{quality.score}%</Text>
            </View>
          ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  gradientContainer: {
    marginVertical: 20,
  },
  legendContainer: {
    width: '100%',
    marginTop: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendRank: {
    width: 30,
    fontSize: 16,
    fontWeight: 'bold',
  },
  legendTitle: {
    flex: 1,
    fontSize: 16,
  },
  legendScore: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RadialQualityGradientExample; 