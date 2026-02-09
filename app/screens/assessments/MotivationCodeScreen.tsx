import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { View, Text } from 'react-native-ui-lib';
import { Ionicons } from '@expo/vector-icons';
import { observer } from '@legendapp/state/react';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';

import { useViewModel } from '@src/hooks/useViewModel';
import { MotivationCodeViewModel, motivationOptions } from '@src/viewModels/MotivationCodeViewModel';
import themeObject from '@app/constants/theme';
import { ModalPicker } from '@src/components/ModalPicker';
import { NavigationViewModel } from '@src/viewModels/NavigationViewModel';
import { FTUX_Routes } from '@src/models/NavigationModel';
import { AssessmentViewModel } from '@src/viewModels/AssessmentViewModel';
import { userAssessments$ } from '@src/models/UserAssessment';

const { colors, typography, spacings } = themeObject;

const options = motivationOptions.map(option => ({ label: option, value: option }));

const MotivationCodeScreen: React.FC = observer(() => {
  const router = useRouter();
  const [isMemoryUpdated, setIsMemoryUpdated] = useState(false);
  const { viewModel } = useViewModel(MotivationCodeViewModel);
  const { viewModel: navigationVM } = useViewModel(NavigationViewModel);
  const { viewModel: assessmentViewModel } = useViewModel(AssessmentViewModel);
  const assessments = userAssessments$;
  
  // Track if we're in edit mode
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentAssessmentId, setCurrentAssessmentId] = useState<string | null>(null);

  const handleClear = useCallback((index: number, event: React.MouseEvent) => {
    event.stopPropagation();
    viewModel.updateMotivation(index, '');
  }, [viewModel]);

  const getAvailableOptions = useCallback((currentValue: string) => {
    return options.filter(option => 
      !viewModel.motivations$.get().includes(option.value) || option.value === currentValue
    );
  }, [viewModel]);
  
  useEffect(() => {
    // Reset motivations when effect runs
    for (let i = 0; i < 5; i++) {
      viewModel.updateMotivation(i, '');
    }
    
    console.log("MotivationCode Screen effect running with currentId:", assessmentViewModel.currentAssessment$.get());
    
    let existingAssessment: any = null;
    
    if (assessmentViewModel.currentAssessment$.get()) {
      // We're in edit mode - find the specific assessment by ID
      existingAssessment = assessmentViewModel.getCurrentAssessment();
      console.log("Loaded assessment for editing:", existingAssessment);
      setIsEditMode(true);
      setCurrentAssessmentId(assessmentViewModel.currentAssessment$.get());
    } else {
      // We're in create mode - find any existing MotivationCode assessment
      existingAssessment = assessments.get().find(a => a.assessment_type === 'MotivationCode');
      console.log("Create mode, found existing MotivationCode:", existingAssessment);
    }

    // Check both possible paths where motivations might be stored
    // First check assessment_data.motivations
    if (existingAssessment?.assessment_data?.motivations) {
      const motivations = existingAssessment.assessment_data.motivations;
      motivations.forEach((motivation: string, index: number) => {
        if (index < 5) { // We only have 5 motivation fields
          viewModel.updateMotivation(index, motivation);
        }
      });
    }
    // Then check additional_data.motivations
    else if (existingAssessment?.additional_data?.motivations) {
      const motivations = existingAssessment.additional_data.motivations;
      motivations.forEach((motivation: string, index: number) => {
        if (index < 5) { // We only have 5 motivation fields
          viewModel.updateMotivation(index, motivation);
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
        <TouchableOpacity onPress={() => router.back()}>
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

      {/* Title */}
      <Text style={typography.h2} marginB-s8>Motivation Code</Text>

      {/* Motivation Selectors */}
      <View marginB-s6>
        {viewModel.motivations$.get().map((motivation, index) => (
          <View key={index} marginB-s4>
            <Text style={[typography.labelText, { color: colors.textSecondary }]} marginB-s2>
              Motivation {index + 1}
            </Text>
            <View style={styles.inputContainer}>
              <ModalPicker
                value$={viewModel.motivations$[index]}
                options={getAvailableOptions(motivation)}
                placeholder="Choose one"
                buttonStyle={styles.modalPickerButton}
                disabled={viewModel.isLoading$.get()}
              />
              {motivation && (
                <TouchableOpacity
                  onPress={(e: any) => handleClear(index, e)}
                  style={styles.clearButton}
                  disabled={viewModel.isLoading$.get()}
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
      <View marginT-s8>
        <Text style={typography.h4} marginB-s4>{isEditMode ? 'Update' : 'Upload'} your files</Text>
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

      {/* Submit Button */}
      <TouchableOpacity
        style={[
          styles.submitButton,
          !isSubmitEnabled && styles.submitButtonDisabled
        ]}
        onPress={handleSubmit}
        disabled={!isSubmitEnabled || viewModel.isLoading$.get()}
      >
        <Text style={[
          styles.submitButtonText,
          !isSubmitEnabled && styles.submitButtonTextDisabled
        ]}>
          {viewModel.isLoading$.get() ? 'Submitting...' : isEditMode ? 'Save Changes' : 'Submit'}
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
  inputContainer: {
    position: 'relative',
    flex: 1,
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
  clearButton: {
    position: 'absolute',
    right: spacings.s4 + 25,
    top: '50%',
    transform: [{ translateY: -12 }],
    padding: spacings.s1,
    zIndex: 1,
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

export default MotivationCodeScreen;