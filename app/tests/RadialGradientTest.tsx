import React from 'react';
import { View, StyleSheet, Text, ScrollView } from 'react-native';
import { Colors, Spacings } from 'react-native-ui-lib';
import RadialQualityGradientView from '@src/components/topQualities/RadialQualityGradientView';
import { RadialQualityGradient } from '@src/components/RadialQualityGradient';
import { IUserTopQuality } from '@src/models/UserTopQuality';

export default function RadialGradientTest() {
  // Sample qualities to directly test RadialQualityGradient
  const sampleQualities: IUserTopQuality[] = [
    {
      title: 'Openness',
      level: 'High',
      description: 'You are curious and open to new experiences.',
      score: 85,
      color: '#C980C6' // Purple
    },
    {
      title: 'Conscientiousness',
      level: 'High',
      description: 'You are organized and goal-oriented.',
      score: 78,
      color: '#EAB045' // Gold/Orange
    },
    {
      title: 'Extraversion',
      level: 'Medium',
      description: 'You are moderately outgoing and sociable.',
      score: 65,
      color: '#ED5F36' // Red/Orange
    }
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Radial Quality Gradient Demo</Text>
      
      <View style={styles.gradientContainer}>
        <RadialQualityGradientView size={200} showLegend={true} />
      </View>
      
      <Text style={styles.description}>
        This component visualizes your top 3 personality qualities as a radial gradient.
        The highest-ranking quality is in the center, with the 2nd and 3rd highest qualities
        forming the middle and outer rings respectively.
      </Text>

      <Text style={styles.subtitle}>New Gradient with Blurred Edge</Text>
      
      <View style={styles.gradientWrapper}>
        <View style={styles.gradientContainerDirect}>
          <RadialQualityGradient 
            qualities={sampleQualities} 
            size={200} 
          />
        </View>
      </View>

      <View style={styles.stopsContainer}>
        <Text style={styles.stopsTitle}>Figma Gradient Stops:</Text>
        <View style={styles.stop}>
          <View style={[styles.colorBox, { backgroundColor: '#C980C6' }]} />
          <Text style={styles.stopText}>31% - #C980C6 - 100% opacity</Text>
        </View>
        <View style={styles.stop}>
          <View style={[styles.colorBox, { backgroundColor: '#EAB045' }]} />
          <Text style={styles.stopText}>52% - #EAB045 - 100% opacity</Text>
        </View>
        <View style={styles.stop}>
          <View style={[styles.colorBox, { backgroundColor: '#ED5F36' }]} />
          <Text style={styles.stopText}>73% - #ED5F36 - 100% opacity</Text>
        </View>
        <View style={styles.stop}>
          <View style={[styles.colorBox, { backgroundColor: '#F0EBE4', borderWidth: 1, borderColor: '#ccc' }]} />
          <Text style={styles.stopText}>100% - #F0EBE4 - 0% opacity (transparent edge)</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  content: {
    padding: Spacings.s6,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: Spacings.s5,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: Spacings.s8,
    marginBottom: Spacings.s3,
    color: Colors.textPrimary,
  },
  gradientContainer: {
    marginVertical: Spacings.s5,
    alignItems: 'center',
  },
  gradientWrapper: {
    padding: 20,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    marginBottom: Spacings.s5,
  },
  gradientContainerDirect: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginTop: Spacings.s5,
    paddingHorizontal: Spacings.s4,
    color: Colors.textSecondary,
  },
  stopsContainer: {
    marginTop: Spacings.s5,
    width: '100%',
    backgroundColor: '#f0f0f0',
    padding: Spacings.s4,
    borderRadius: 8,
  },
  stopsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: Spacings.s3,
  },
  stop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacings.s2,
  },
  colorBox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    marginRight: Spacings.s2,
  },
  stopText: {
    fontSize: 14,
  },
}); 