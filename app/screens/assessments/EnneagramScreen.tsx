import React, { useCallback, useState, useEffect } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { View, Text } from 'react-native-ui-lib';
import { Ionicons } from '@expo/vector-icons';
import { observer } from '@legendapp/state/react';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';

import { useViewModel } from '@src/hooks/useViewModel';
import { EnneagramViewModel } from '@src/viewModels/EnneagramViewModel';
import { ReactiveTextField } from '@src/components/ReactiveTextField';
import themeObject, { customColors } from '@app/constants/theme';
import { NavigationViewModel } from '@src/viewModels/NavigationViewModel';
import { FTUX_Routes } from '@src/models/NavigationModel';
import { assessmentStyles } from '@src/components/text/types';
import { ButtonRegular } from '@src/components/text/ButtonRegular';
import { AssessmentViewModel } from '@src/viewModels/AssessmentViewModel';
import { userAssessments$ } from '@src/models/UserAssessment';

const { colors, typography, spacings } = themeObject;

const EnneagramScreen: React.FC = observer(() => {
  const router = useRouter();
  const { viewModel } = useViewModel(EnneagramViewModel);
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
    
    console.log("Enneagram Screen effect running with currentId:", assessmentViewModel.currentAssessment$.get());
    
    let existingAssessment: any = null;
    
    if (assessmentViewModel.currentAssessment$.get()) {
      // We're in edit mode - find the specific assessment by ID
      existingAssessment = assessmentViewModel.getCurrentAssessment();
      console.log("Loaded assessment for editing:", existingAssessment);
      setIsEditMode(true);
      setCurrentAssessmentId(assessmentViewModel.currentAssessment$.get());
    } else {
      // We're in create mode - find any existing Enneagram assessment
      existingAssessment = assessments.get().find(a => a.assessment_type === 'Enneagram');
      console.log("Create mode, found existing Enneagram:", existingAssessment);
    }

    // Check both possible paths where scores might be stored
    if (existingAssessment?.assessment_data?.scores) {
      const scores = existingAssessment.assessment_data.scores as Record<string, number>;
      Object.entries(scores).forEach(([key, value]) => {
        // Extract the type number (e.g., "type1" -> 1)
        const typeMatch = key.match(/type(\d+)/);
        if (typeMatch && typeMatch[1]) {
          const index = parseInt(typeMatch[1], 10) - 1;
          if (index >= 0 && index < viewModel.scores$.get().length) {
            viewModel.updateScore(index, value.toString());
          }
        }
      });
    } 
    else if (existingAssessment?.additional_data?.scores) {
      const scores = existingAssessment.additional_data.scores as Record<string, number>;
      Object.entries(scores).forEach(([key, value]) => {
        // Extract the type number (e.g., "type1" -> 1)
        const typeMatch = key.match(/type(\d+)/);
        if (typeMatch && typeMatch[1]) {
          const index = parseInt(typeMatch[1], 10) - 1;
          if (index >= 0 && index < viewModel.scores$.get().length) {
            viewModel.updateScore(index, value.toString());
          }
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
    if (!isNaN(score) && score >= 0 && score <= 100) {
      viewModel.updateScore(index, numericValue);
    } else if (numericValue === '') {
      // Allow empty input for clearing
      viewModel.updateScore(index, '');
    } else {
      Toast.show({
        type: 'error',
        text1: 'Invalid Score',
        text2: 'Please enter a number between 0 and 100',
        position: 'bottom',
      });
    }
  }, [viewModel]);

  const handleAboutMyResults = () => {
    console.log("Handle About My Results");
  }

  const handleRetake = () => {
    console.log("Handle Retake");
  }

  const handleFileUpload = useCallback(async () => {
    try {
      Toast.show({
        type: 'info',
        text1: 'Processing file...',
        text2: '',
        position: 'bottom',
      });

      const result = await viewModel.handleFileUpload((progressInfo) => {
        Toast.show({
          type: progressInfo.type,
          text1: progressInfo.text1,
          text2: progressInfo.text2,
          position: 'bottom',
        });
      });

      if (result.isErr()) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: result.error.message,
          position: 'bottom',
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error instanceof Error ? error.message : 'Failed to upload file',
        position: 'bottom',
      });
    }
  }, [viewModel]);

  const handleRemoveFile = useCallback(async (fileName: string) => {
    try {
      const result = await viewModel.removeFile(fileName);
      if (result.isErr()) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: result.error.message,
          position: 'bottom',
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error instanceof Error ? error.message : 'Failed to remove file',
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
          disabled={!isSubmitEnabled || viewModel.isLoading$.get()}
        >
          <Text style={[
            typography.bodyLBold,
            { color: isSubmitEnabled && !viewModel.isLoading$.get() ? colors.textPrimary : colors.textSecondary }
          ]}>
            {viewModel.isLoading$.get() ? 'Submitting...' : 'Done'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Title and Description */}
      <View marginB-s8>
        <Text style={typography.h2} marginB-s2>Enneagram</Text>
        <Text style={[typography.bodyM, { color: colors.textSecondary }]}>
          Add your score out of 100 for each type.
        </Text>
      </View>

      {/* Type Inputs */}
      <View style={styles.grid}>
        {viewModel.scores$.get().map((type, index) => (
          <View key={type.name} style={styles.gridItem}>
            <Text style={[typography.labelText, { color: colors.textSecondary }]} marginB-s2>
              {type.name}
            </Text>
            <View style={styles.inputContainer}>
              <ReactiveTextField
                value$={viewModel.scores$[index].score}
                onChangeText={(value) => handleScoreChange(index, value)}
                placeholder="Add (0 - 100)"
                keyboardType="numeric"
                style={styles.input}
                placeholderTextColor={colors.textSecondary}
                maxLength={3}
                editable={!viewModel.isLoading$.get()}
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
      <View style={assessmentStyles.uploadsContainer}>
        <Text style={typography.h4} marginB-s4>Your uploads</Text>
        <View style={styles.uploadContainer}>
          {viewModel.uploadedFiles$.get().length === 0 ? (
            <>
              <Text style={[typography.bodyM, { color: colors.textSecondary }]}>None</Text>
              <TouchableOpacity onPress={handleFileUpload} disabled={viewModel.isLoading$.get()}>
                <Text style={[typography.bodyMBold, viewModel.isLoading$.get() && styles.disabledText]}>Add</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {viewModel.uploadedFiles$.get().map((file) => (
                <View key={file.name} style={styles.uploadItem}>
                  <Text style={typography.bodyM}>{file.name}</Text>
                  <TouchableOpacity onPress={() => handleRemoveFile(file.name)} disabled={viewModel.isLoading$.get()}>
                    <Ionicons name="trash-outline" size={20} color={viewModel.isLoading$.get() ? colors.textSecondary : colors.primary} />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity onPress={handleFileUpload} style={styles.uploadMoreButton} disabled={viewModel.isLoading$.get()}>
                <Text style={[typography.bodyM, styles.uploadMoreText, viewModel.isLoading$.get() && styles.disabledText]}>
                  Upload more results
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Action Buttons */}
      {
        !navigationVM.getIsMyData() ? (
          <TouchableOpacity
            style={[
              assessmentStyles.submitButton,
              !isSubmitEnabled && assessmentStyles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={!isSubmitEnabled}>
            <Text style={[
              assessmentStyles.submitButtonText,
              !isSubmitEnabled && assessmentStyles.submitButtonTextDisabled
            ]}>
              {isEditMode ? 'Save Changes' : 'Submit'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={assessmentStyles.myDataButtonsContainer}>
            <TouchableOpacity
              style={assessmentStyles.submitButton}
              onPress={handleAboutMyResults}>
              <ButtonRegular color={customColors.white}>About my results</ButtonRegular>
            </TouchableOpacity>
            <TouchableOpacity
              style={assessmentStyles.submitButton}
              onPress={handleRetake}>
              <ButtonRegular color={customColors.white}>Re-Take Enneagram</ButtonRegular>
            </TouchableOpacity>
          </View>
        )
      }
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
    backgroundColor: colors.backgroundLight,
    padding: spacings.s3,
    borderRadius: 8,
    marginBottom: spacings.s3,
  },
  uploadMoreButton: {
    alignItems: 'center',
    marginTop: spacings.s2,
  },
  uploadMoreText: {
    textDecorationLine: 'underline',
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
  disabledText: {
    color: colors.textSecondary,
  },
});

export default EnneagramScreen;