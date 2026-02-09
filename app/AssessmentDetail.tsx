import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useViewModel } from '@src/hooks/useViewModel';
import { AssessmentViewModel } from '@src/viewModels/AssessmentViewModel';
import { NavigationViewModel } from '@src/viewModels/NavigationViewModel';
import { useObservable } from '@legendapp/state/react';
import { customColors } from '@app/constants/theme';
import { router } from 'expo-router';
import { userAssessments$ } from '@src/models/UserAssessment';
import { Text } from 'react-native-ui-lib';
import { showErrorToast } from '@src/utils/ToastUtils';

/**
 * AssessmentDetail router screen
 *
 * This screen is responsible for:
 * 1. Getting the current assessment ID from AssessmentViewModel
 * 2. Finding the corresponding assessment in userAssessments$
 * 3. Redirecting to the appropriate assessment-specific screen
 */
export default function AssessmentDetail() {
  const { viewModel: assessmentViewModel } = useViewModel(AssessmentViewModel);
  const { viewModel: navigationViewModel } = useViewModel(NavigationViewModel);
  const currentAssessmentId = useObservable(assessmentViewModel.currentAssessment$);
  const assessments = useObservable(userAssessments$);
  const isMyData = useObservable(navigationViewModel.isMyData$);

  useEffect(() => {
    // Find the assessment by ID
    const currentAssessment = assessments.get()
      .find(assessment => assessment.id === currentAssessmentId.get());

    if (!currentAssessment) {
      console.error("No assessment found with ID:", currentAssessmentId.get());
      showErrorToast("Error", "Could not find the selected assessment");
      router.back();
      return;
    }

    // Route to the specific assessment screen based on assessment_type
    const assessmentType = currentAssessment.assessment_type;

    // Log the MyData state so we can debug
    console.log(`AssessmentDetail routing to ${assessmentType} with isMyData=${isMyData.get()}`);

    // Add a short delay to ensure smooth transition
    setTimeout(() => {
      // Make sure assessmentType is a valid string before using it in the route
      if (assessmentType && typeof assessmentType === 'string' && assessmentType.trim() !== '') {
        // We need to preserve the isMyData state when navigating
        // No need to reset it here as it will be reset when navigating away from assessments
        router.replace(`/${assessmentType}`);
      } else {
        console.error("Invalid assessment type:", assessmentType);
        showErrorToast("Error", "Invalid assessment type");
        router.back();
      }
    }, 100);
  }, [currentAssessmentId.get()]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={customColors.black1} />
      <Text style={styles.loadingText}>Loading assessment...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: customColors.beige1
  },
  loadingText: {
    marginTop: 16,
    color: customColors.black1,
    fontFamily: 'WorkSans',
    fontSize: 16
  }
});