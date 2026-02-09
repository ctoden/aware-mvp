import { observer } from '@legendapp/state/react';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import Toast from 'react-native-toast-message';
import { Text, TouchableOpacity, View } from 'react-native-ui-lib';

import themeObject from '@app/constants/theme';
import { ReactiveTextField } from '@src/components/ReactiveTextField';
import { useViewModel } from '@src/hooks/useViewModel';
import { BigFiveViewModel } from '@src/viewModels/BigFiveViewModel';
import { NavigationViewModel } from '@src/viewModels/NavigationViewModel';
import { FTUX_Routes } from '@src/models/NavigationModel';
import { AssessmentViewModel } from '@src/viewModels/AssessmentViewModel';
import { userAssessments$ } from '@src/models/UserAssessment';

const { colors, typography, spacings } = themeObject;

const BigFiveScreen: React.FC = observer(() => {
  const router = useRouter();
  const { viewModel } = useViewModel(BigFiveViewModel);
  const { viewModel: navigationVM } = useViewModel(NavigationViewModel);
  const { viewModel: assessmentViewModel } = useViewModel(AssessmentViewModel);
  const assessments = userAssessments$;
  const [isMemoryUpdated, setIsMemoryUpdated] = useState(false);
  
  // Track if we're in edit mode
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentAssessmentId, setCurrentAssessmentId] = useState<string | null>(null);

  useEffect(() => {
    // Reset scores when effect runs
    viewModel.scores$.get().forEach((_, index) => {
      viewModel.updateScore(index, '');
    });
    
    console.log("BigFive Screen effect running with currentId:", assessmentViewModel.currentAssessment$.get());
    
    let existingAssessment: any = null;
    
    if (assessmentViewModel.currentAssessment$.get()) {
      // We're in edit mode - find the specific assessment by ID
      existingAssessment = assessmentViewModel.getCurrentAssessment();
      console.log("Loaded assessment for editing:", existingAssessment);
      setIsEditMode(true);
      setCurrentAssessmentId(assessmentViewModel.currentAssessment$.get());
    } else {
      // We're in create mode - find any existing BigFive assessment
      existingAssessment = assessments.get().find(a => a.assessment_type === 'BigFive');
      console.log("Create mode, found existing BigFive:", existingAssessment);
    }

    // Check both possible paths where scores might be stored
    if (existingAssessment?.assessment_data?.scores) {
      const scores = existingAssessment.assessment_data.scores as Record<string, number>;
      Object.entries(scores).forEach(([key, value]) => {
        const index = viewModel.scores$.get().findIndex(s => 
          s.name.toLowerCase() === key.toLowerCase()
        );
        if (index >= 0) {
          viewModel.updateScore(index, value.toString());
        }
      });
    } 
    else if (existingAssessment?.additional_data?.scores) {
      const scores = existingAssessment.additional_data.scores as Record<string, number>;
      Object.entries(scores).forEach(([key, value]) => {
        const index = viewModel.scores$.get().findIndex(s => 
          s.name.toLowerCase() === key.toLowerCase()
        );
        if (index >= 0) {
          viewModel.updateScore(index, value.toString());
        }
      });
    }

    const unsubscribe = viewModel.isMemoryUpdated$.onChange((_) => {
      setIsMemoryUpdated(true);
    });

    return () => {
      unsubscribe();
    };
  }, [assessmentViewModel, viewModel]);

  const handleScoreChange = useCallback((index: number, value: string) => {
    // Remove any non-numeric characters
    const numericValue = value.replace(/[^0-9]/g, '');
    
    // Convert to number and validate range
    const score = parseInt(numericValue, 10);
    if (!isNaN(score) && score >= 0 && score <= 120) {
      viewModel.updateScore(index, numericValue);
    } else if (numericValue === '') {
      // Allow empty input for clearing
      viewModel.updateScore(index, '');
    } else {
      Toast.show({
        type: 'error',
        text1: 'Invalid Score',
        text2: 'Please enter a number between 0 and 120',
        position: 'bottom',
      });
    }
  }, [viewModel]);

  const handleFileUpload = useCallback(async () => {
    const result = await viewModel.handleFileUpload();
    if (result.isErr()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: result.error.message,
        position: 'bottom',
      });
    }
  }, [viewModel]);

  const handleRemoveFile = useCallback(async (fileName: string) => {
    const result = await viewModel.removeFile(fileName);
    if (result.isErr()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: result.error.message,
        position: 'bottom',
      });
    }
  }, [viewModel]);

  const handleSubmit = useCallback(async () => {
    try {
      if (isEditMode && currentAssessmentId) {
        // We're in edit mode - update existing assessment
        Toast.show({
          type: 'info',
          text1: 'Updating assessment...',
          text2: '',
          position: 'bottom',
        });

        // Add updateAssessment method call - Need to add this method to BigFiveViewModel
        const result = await viewModel.updateAssessment(currentAssessmentId);
        if (result.isErr()) {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: result.error.message,
            position: 'bottom',
          });
          return;
        }

        setIsMemoryUpdated(true);
        Toast.show({
          type: 'success',
          text1: 'Assessment updated successfully',
          text2: '',
          position: 'bottom',
        });
        
        // Return to My Data screen
        setTimeout(() => router.push('/MyData'), 1000);
      } else {
        // We're in create mode - create new assessment
        Toast.show({
          type: 'info',
          text1: 'Submitting assessment...',
          text2: '',
          position: 'bottom',
        });

        const result = await viewModel.submitAssessment();
        if (result.isErr()) {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: result.error.message,
            position: 'bottom',
          });
          return;
        }

        setIsMemoryUpdated(true);
        Toast.show({
          type: 'success',
          text1: 'Assessment saved successfully',
          text2: '',
          position: 'bottom',
        });
        if (navigationVM.getFTUX()) {
          router.push(navigationVM.getRouteFor(FTUX_Routes.ChooseAssessment));
        } else {
          router.back();
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save assessment';
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage,
        position: 'bottom',
      });
    }
  }, [viewModel, navigationVM, router, isEditMode, currentAssessmentId]);

  const isSubmitEnabled = viewModel.isSubmitEnabled();

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View row spread marginB-s8>
        <TouchableOpacity onPress={() => {
          // Reset isMyData flag when navigating back
          navigationVM.setIsMyData(false);
          router.back();
        }}>
          <Text style={typography.bodyLBold}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={handleSubmit}
          disabled={!isSubmitEnabled}
        >
          <Text style={[
            typography.bodyLBold, 
            { color: isSubmitEnabled ? colors.textPrimary : colors.textSecondary }
          ]}>
            Done
          </Text>
        </TouchableOpacity>
      </View>

      {/* Title and Description */}
      <View marginB-s8>
        <Text style={typography.h2} marginB-s2>The Big Five</Text>
        <Text style={[typography.bodyM, { color: colors.textSecondary }]}>
          Add your score out of 120 for each item.
        </Text>
      </View>

      {/* Trait Inputs */}
      <View style={styles.grid}>
        {viewModel.scores$.get().map((trait, index) => (
          <View key={trait.name} style={styles.gridItem}>
            <Text style={[typography.labelText, { color: colors.textSecondary }]} marginB-s2>
              {trait.name}
            </Text>
            <View style={styles.inputContainer}>
              <ReactiveTextField
                value$={viewModel.scores$[index].score}
                onChangeText={(value) => handleScoreChange(index, value)}
                placeholder="Add (0 - 120)"
                keyboardType="numeric"
                style={styles.input}
                placeholderTextColor={colors.textSecondary}
                maxLength={3}
              />
            </View>
          </View>
        ))}
      </View>

      {/* Memory Updated Status */}
      {isMemoryUpdated && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>Memory updated</Text>
        </View>
      )}

      {/* Uploads Section */}
      <View marginT-s8>
        <Text style={typography.h4} marginB-s4>{isEditMode ? 'Update' : 'Upload'} your files</Text>
        <View style={styles.uploadContainer}>
          {viewModel.uploadedFiles$.get().length === 0 ? (
            <>
              <Text style={[typography.bodyM, { color: colors.textSecondary }]}>None</Text>
              <TouchableOpacity onPress={handleFileUpload}>
                <Text style={typography.bodyMBold}>Add</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {viewModel.uploadedFiles$.get().map((file) => (
                <View key={file.name} style={styles.uploadItem}>
                  <Text style={typography.bodyM}>{file.name}</Text>
                  <TouchableOpacity onPress={() => handleRemoveFile(file.name)}>
                    <Text style={[typography.bodyMBold, { color: colors.error }]}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity onPress={handleFileUpload} style={styles.uploadMoreButton}>
                <Text style={typography.bodyMBold}>Add More</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[
          styles.submitButton,
          !isSubmitEnabled && styles.submitButtonDisabled
        ]}
        onPress={handleSubmit}
        disabled={!isSubmitEnabled}
      >
        <Text style={[
          styles.submitButtonText,
          !isSubmitEnabled && styles.submitButtonTextDisabled
        ]}>
          {isEditMode ? 'Save Changes' : 'Submit'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
    padding: spacings.s6,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacings.s3,
  },
  gridItem: {
    width: '50%',
    paddingHorizontal: spacings.s3,
    marginBottom: spacings.s4,
  },
  inputContainer: {
    backgroundColor: colors.backgroundAccent,
    borderRadius: 24,
    paddingHorizontal: spacings.s4,
    paddingVertical: spacings.s3,
  },
  input: {
    ...typography.bodyL,
    backgroundColor: 'transparent',
  },
  inputPlaceholder: {
    color: colors.textSecondary,
    opacity: 0.5,
  },
  uploadContainer: {
    backgroundColor: colors.backgroundAccent,
    borderRadius: 24,
    paddingHorizontal: spacings.s4,
    paddingVertical: spacings.s3,
  },
  uploadItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacings.s2,
  },
  uploadMoreButton: {
    marginTop: spacings.s3,
    alignItems: 'center',
  },
  statusContainer: {
    backgroundColor: colors.success,
    padding: spacings.s3,
    borderRadius: 8,
    marginTop: spacings.s4,
    marginBottom: spacings.s4,
  },
  statusText: {
    ...typography.bodyM,
    color: colors.backgroundLight,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: colors.textPrimary,
    padding: spacings.s4,
    borderRadius: 24,
    marginTop: spacings.s6,
    marginBottom: spacings.s6,
  },
  submitButtonDisabled: {
    backgroundColor: colors.backgroundAccent,
  },
  submitButtonText: {
    ...typography.bodyLBold,
    color: colors.backgroundLight,
    textAlign: 'center',
  },
  submitButtonTextDisabled: {
    color: colors.textSecondary,
  },
});

export default BigFiveScreen;