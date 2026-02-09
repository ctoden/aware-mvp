import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { View, Text, Image, TouchableOpacity } from 'react-native-ui-lib';
import { AssessmentsTakenListCard } from './AssessmentsTakenListCard';
import { AssessmentData } from './types';
import { customColors } from '@app/constants/theme';
import { userAssessments$ } from '@src/models/UserAssessment';
import { observer } from '@legendapp/state/react';
import { AssessmentListView } from '../AssessmentListView';
import PlusButton from '@src/components/icons/PlusButton';
import { useRouter } from 'expo-router';
import { NavigationViewModel } from '@src/viewModels/NavigationViewModel';
import { useViewModel } from '@src/hooks/useViewModel';

const extractPersonalityType = (text: string): string => {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => line.charAt(0))
    .join('');
};



export const AssessmentsTaken: React.FC = observer(() => {
  const { viewModel: navigationVM } = useViewModel(NavigationViewModel);
  const [assessments, setAssessments] = useState<AssessmentData[]>([]);
  const { width } = useWindowDimensions();
  const navigation = useRouter();

  const handleAddAssessment = useCallback(() => {
    navigationVM.setFTUX(false);
    navigation.navigate("AddAssessment");
  }, [navigationVM, navigation]);

  useEffect(() => {
    console.log("~~~~ AssessmentsTaken userAssessments$.get()", userAssessments$.get().map(assessment => assessment.assessment_summary));
    const userAssessments = userAssessments$.get().map(assessment => ({
      title: `${assessment.name} (${assessment.assessment_type})`,
      value: extractPersonalityType(assessment.assessment_summary ?? '')
    }));
    console.log("~~~~ AssessmentsTaken userAssessments", userAssessments);
    setAssessments(userAssessments);
  }, []);

  return (
    <View width="100%" style={{ width: "100%", maxWidth: width - 32 }}>
      <View width="100%">
        <Text h2>Assessments</Text>
        <Text bodyRegular>
          Add more assessments to gain deeper insight about your personality
        </Text>
      </View>
      <AssessmentListView />

      <View width="100%" row style={{ width: '100%', justifyContent: 'center' }}>
        <TouchableOpacity style={styles.addButton} accessibilityRole="button" onPress={handleAddAssessment}>
            <PlusButton iconcolor={customColors.white} style={styles.addIcon} />
            <Text style={styles.addButtonText}>Add an assessment</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    fontFamily: 'Work Sans, sans-serif',
    color: '#212120',
  },
  header: {
    display: 'flex',
    width: '100%',
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 24,
    letterSpacing: -0.48,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    letterSpacing: -0.24,
    marginTop: 8,
  },
  assessmentsList: {
    borderRadius: 24,
    display: 'flex',
    marginTop: 20,
    width: '100%',
    minWidth: 360,
    paddingLeft: 16,
    paddingTop: 16,
    paddingBottom: 16,
    flexDirection: 'column',
    alignItems: 'stretch',
    fontSize: 16,
    gap: 16,
    backgroundColor: customColors.beige2,
  },
  addButton: {
    borderRadius: 50,
    display: 'flex',
    marginTop: 20,
    marginHorizontal: 0,
    minHeight: 56,
    width: '100%',
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 4,
    justifyContent: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    backgroundColor: customColors.black1,
  },
  addIcon: {
    alignSelf: 'stretch',
    width: 24,
    aspectRatio: 1,
  },
  addButtonText: {
    alignSelf: 'center',
    fontSize: 16,
    color: '#F0EBE4',
    fontWeight: '600',
    letterSpacing: -0.16,
    lineHeight: 16,
  },
});