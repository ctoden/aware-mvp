import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { View, Text } from 'react-native-ui-lib';
import { Ionicons } from '@expo/vector-icons';
import { observer } from '@legendapp/state/react';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';

import { useViewModel } from '@src/hooks/useViewModel';
import { CliftonStrengthsViewModel } from '@src/viewModels/CliftonStrengthsViewModel';
import themeObject, { customColors } from '@app/constants/theme';
import { ModalPicker } from '@src/components/ModalPicker';
import { NavigationViewModel } from '@src/viewModels/NavigationViewModel';
import { FTUX_Routes } from '@src/models/NavigationModel';
import { ButtonRegular } from '@src/components/text/ButtonRegular';
import { assessmentStyles } from '@src/components/text/types';
import { AssessmentViewModel } from '@src/viewModels/AssessmentViewModel';
import { userAssessments$ } from '@src/models/UserAssessment';

const { colors, typography, spacings } = themeObject;

const strengthOptions = [
  'Achiever', 'Activator', 'Adaptability', 'Analytical', 'Arranger',
  'Belief', 'Command', 'Communication', 'Competition', 'Connectedness',
  'Consistency', 'Context', 'Deliberative', 'Developer', 'Discipline',
  'Empathy', 'Focus', 'Futuristic', 'Harmony', 'Ideation',
  'Includer', 'Individualization', 'Input', 'Intellection', 'Learner',
  'Maximizer', 'Positivity', 'Relator', 'Responsibility', 'Restorative',
  'Self-Assurance', 'Significance', 'Strategic', 'Woo'
].map(strength => ({ label: strength, value: strength }));

const CliftonStrengthsScreen: React.FC = observer(() => {
  const router = useRouter();
  const [isMemoryUpdated, setIsMemoryUpdated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { viewModel } = useViewModel(CliftonStrengthsViewModel);
  const { viewModel: navigationVM } = useViewModel(NavigationViewModel);
  const { viewModel: assessmentViewModel } = useViewModel(AssessmentViewModel);
  const assessments = userAssessments$;
  
  // Track if we're in edit mode
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentAssessmentId, setCurrentAssessmentId] = useState<string | null>(null);

  const handleClear = useCallback((index: number, event: React.MouseEvent) => {
    event.stopPropagation();
    viewModel.updateStrength(index, '');
  }, [viewModel]);
  
  useEffect(() => {
    // Reset strengths when effect runs
    viewModel.strengths$.get().forEach((_, index) => {
      viewModel.updateStrength(index, '');
    });
    
    console.log("CliftonStrengths Screen effect running with currentId:", assessmentViewModel.currentAssessment$.get());
    
    let existingAssessment: any = null;
    
    if (assessmentViewModel.currentAssessment$.get()) {
      // We're in edit mode - find the specific assessment by ID
      existingAssessment = assessmentViewModel.getCurrentAssessment();
      console.log("Loaded assessment for editing:", existingAssessment);
      setIsEditMode(true);
      setCurrentAssessmentId(assessmentViewModel.currentAssessment$.get());
    } else {
      // We're in create mode - find any existing CliftonStrengths assessment
      existingAssessment = assessments.get().find(a => a.assessment_type === 'CliftonStrengths');
      console.log("Create mode, found existing CliftonStrengths:", existingAssessment);
    }

    // Check both possible paths where strengths might be stored
    // First check assessment_data.strengths
    if (existingAssessment?.assessment_data?.strengths) {
      const strengths = existingAssessment.assessment_data.strengths;
      strengths.forEach((strength: string, index: number) => {
        if (index < 5) { // We only have 5 strength fields
          viewModel.updateStrength(index, strength);
        }
      });
    }
    // Then check additional_data.strengths
    else if (existingAssessment?.additional_data?.strengths) {
      const strengths = existingAssessment.additional_data.strengths;
      strengths.forEach((strength: string, index: number) => {
        if (index < 5) { // We only have 5 strength fields
          viewModel.updateStrength(index, strength);
        }
      });
    }

    // Setup subscription to memory updated state
    const unsubscribe = viewModel.isMemoryUpdated$.onChange((_) => {
      setIsMemoryUpdated(true);
    });

    return () => {
      unsubscribe();
    };
  }, [assessmentViewModel, viewModel]);

  const handleAboutMyResults = () => {
    console.log("Handle About My Results");
  }

  const handleRetake = () => {
    console.log("Handle Retake");
  }

  const handleFileUpload = useCallback(async () => {
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
      setIsSubmitting(true);
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
    } finally {
      setIsSubmitting(false);
    }
  }, [viewModel, navigationVM, router, isEditMode, currentAssessmentId]);

  const isSubmitEnabled = viewModel.isSubmitEnabled() && !isSubmitting;

  return (
    <ScrollView style={assessmentStyles.scrollView}>
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

      {/* Title */}
      <View marginB-s8>
        <Text style={typography.h2}>CliftonStrengths®</Text>
      </View>

      {/* Strength Selectors */}
      <View style={styles.strengthsContainer}>
        {viewModel.strengths$.get().map((strength, index) => (
          <View key={index} style={styles.strengthItem}>
            <Text style={[typography.labelText, { color: colors.textSecondary }]} marginB-s2>
              Strength {index + 1}
            </Text>
            <View style={styles.inputContainer}>
              <ModalPicker
                value$={viewModel.strengths$[index].value}
                options={strengthOptions}
                placeholder="Choose one"
                label=""
                buttonStyle={styles.modalPickerButton}
              />
              {strength.value && (
                <TouchableOpacity
                  onPress={(e: any) => handleClear(index, e)}
                  style={styles.clearButton}
                >
                  <Ionicons name="close" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
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
        <Text style={assessmentStyles.uploadsTitle}>{isEditMode ? 'Update' : 'Upload'} your files</Text>
        <View style={assessmentStyles.uploadsContainer}>
          {viewModel.uploadedFiles$.get().length === 0 ? (
            <>
              <Text style={assessmentStyles.uploadDescription}>
                Upload your Clifton Strengths results as text, PDF, or image
              </Text>
              <TouchableOpacity style={assessmentStyles.uploadButton} onPress={handleFileUpload}>
                <Ionicons name="cloud-upload-outline" size={24} color="#000" />
                <Text style={assessmentStyles.uploadButtonText}>Upload results</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {viewModel.uploadedFiles$.get().map((file) => (
                <View key={file.name} style={assessmentStyles.uploadItem}>
                  <Text style={typography.bodyM}>{file.name}</Text>
                  <TouchableOpacity onPress={() => handleRemoveFile(file.name)}>
                    <Ionicons name="trash-outline" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity onPress={handleFileUpload} style={assessmentStyles.uploadMoreButton}>
                <Text style={[typography.bodyM, assessmentStyles.uploadMoreText]}>Upload more results</Text>
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
              <ButtonRegular color={customColors.white}>Re-Take CliftonStrengths®</ButtonRegular>
            </TouchableOpacity>
          </View>
        )
      }
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  myDataButtonsContainer: {
    flexDirection: 'column',
    gap: 12,
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
    padding: spacings.s6,
  },
  strengthsContainer: {
    gap: spacings.s4,
  },
  strengthItem: {
    marginBottom: spacings.s4,
  },
  inputContainer: {
    position: 'relative',
    flex: 1,
  },
  clearButton: {
    position: 'absolute',
    right: spacings.s4 + 25,
    top: '50%',
    transform: [{ translateY: -12 }],
    padding: spacings.s1,
    zIndex: 1,
  },
  modalPickerButton: {
    backgroundColor: colors.backgroundAccent,
    borderRadius: 24,
    paddingHorizontal: spacings.s4,
    paddingVertical: spacings.s3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 48,
  },
  uploadContainer: {
    backgroundColor: colors.backgroundAccent,
    borderRadius: 24,
    paddingHorizontal: spacings.s4,
    paddingVertical: spacings.s3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
});

export default CliftonStrengthsScreen;