import { Ionicons } from '@expo/vector-icons';
import { observer, useObservable } from '@legendapp/state/react';
import { useViewModel } from '@src/hooks/useViewModel';
import { FileUploadProgressInfo } from '@src/utils/AssessmentResultsFileUploadUtils';
import { MBTIViewModel } from "@src/viewModels/MBTIViewModel";
import { AssessmentViewModel } from "@src/viewModels/AssessmentViewModel";
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { View, Text } from 'react-native-ui-lib';
import Toast from 'react-native-toast-message';
import { useRouter } from 'expo-router';
import { NavigationViewModel } from '@src/viewModels/NavigationViewModel';
import { FTUX_Routes } from '@src/models/NavigationModel';
import themeObject, { customColors } from '@app/constants/theme';
import { ButtonRegular } from '@src/components/text/ButtonRegular';
import { assessmentStyles } from '@src/components/text/types';
import { BodyRegular } from '@src/components/text/BodyRegular';
const { colors, typography } = themeObject;
import { userAssessments$ } from '@src/models/UserAssessment';

type PersonalityDimension = 'E' | 'I' | 'S' | 'N' | 'T' | 'F' | 'J' | 'P';

const MBTIScreen: React.FC = observer(() => {
  const router = useRouter();
  const [isMemoryUpdated, setIsMemoryUpdated] = useState(false);
  const [selectedEI, setSelectedEI] = useState<'E' | 'I' | null>(null);
  const [selectedSN, setSelectedSN] = useState<'S' | 'N' | null>(null);
  const [selectedTF, setSelectedTF] = useState<'T' | 'F' | null>(null);
  const [selectedJP, setSelectedJP] = useState<'J' | 'P' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { viewModel: assessmentVM } = useViewModel(MBTIViewModel);
  const { viewModel: navigationVM } = useViewModel(NavigationViewModel);
  const { viewModel: assessmentViewModel } = useViewModel(AssessmentViewModel);
  const assessments = userAssessments$;
  
  // Track if we're in edit mode
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentAssessmentId, setCurrentAssessmentId] = useState<string | null>(null);

  useEffect(() => {
    // Reset state when effect runs
    setSelectedEI(null);
    setSelectedSN(null);
    setSelectedTF(null);
    setSelectedJP(null);
    
    console.log("MBTI Screen effect running with currentId:", assessmentViewModel.currentAssessment$.get());
    
    let existingAssessment: any = null;
    
    if (assessmentViewModel.currentAssessment$.get()) {
      // We're in edit mode - find the specific assessment by ID
      existingAssessment = assessmentViewModel.getCurrentAssessment();
      console.log("Loaded assessment for editing:", existingAssessment);
      setIsEditMode(true);
      setCurrentAssessmentId(assessmentViewModel.currentAssessment$.get());
    } else {
      // We're in create mode - find any existing MBTI assessment
      existingAssessment = assessments.get().find(a => a.assessment_type === 'MBTI');
      console.log("Create mode, found existing MBTI:", existingAssessment);
    }

    if (existingAssessment?.assessment_summary) {
      console.log("assessment_summary format:", JSON.stringify(existingAssessment.assessment_summary));
      
      // Parse the summary to get the individual selections
      // Handle both formats: "INTJ" or "E - Extroversion\nN - Intuition\nF - Feeling\nP - Perceiving"
      const summary = existingAssessment.assessment_summary.trim();
      
      // Determine which format we're dealing with
      let type = '';
      if (summary.length === 4) {
        // Simple format like "INTJ"
        type = summary;
      } else {
        // Verbose format with newlines
        // Extract first character from each line
        const lines = summary.split('\n');
        lines.forEach((line: string) => {
          const match = line.match(/^([EINSFTJP])/);
          if (match && match[1]) {
            type += match[1];
          }
        });
        console.log("Extracted MBTI type:", type);
      }
      
      if (type.length === 4) {
        setSelectedEI(type[0] as 'E' | 'I');
        setSelectedSN(type[1] as 'S' | 'N');
        setSelectedTF(type[2] as 'T' | 'F');
        setSelectedJP(type[3] as 'J' | 'P');

        // Update the view model's dichotomies
        assessmentVM.selectedDichotomies$.set({
          energy: type[0] as 'E' | 'I',
          information: type[1] as 'S' | 'N',
          decision: type[2] as 'T' | 'F',
          lifestyle: type[3] as 'J' | 'P'
        });
      }
    }
  }, [assessmentViewModel]);

  const isSubmitEnabled = selectedEI !== null &&
    selectedSN !== null &&
    selectedTF !== null &&
    selectedJP !== null;

  const showProgressMessage = useCallback((progressInfo: FileUploadProgressInfo) => {
    Toast.show({
      type: progressInfo.type,
      text1: progressInfo.text1,
      text2: progressInfo.text2,
      position: 'bottom',
      visibilityTime: 2000,
    });
  }, [assessmentViewModel]);

  const handleFileUpload = useCallback(async () => {
    await assessmentVM.handleAssessmentFileUpload(showProgressMessage);
  }, [assessmentVM]);

  const handleRemoveFile = useCallback(async (fileName: string) => {
    try {
      await assessmentVM?.removeFile(fileName);
      showProgressMessage({
        type: 'success',
        text1: 'File removed successfully',
        text2: '',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove file';
      showProgressMessage({
        type: 'error',
        text1: 'Error',
        text2: errorMessage,
      });
    }
  }, [assessmentVM]);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      // Update the dichotomies in the view model
      assessmentVM.selectedDichotomies$.set({
        energy: selectedEI,
        information: selectedSN,
        decision: selectedTF,
        lifestyle: selectedJP
      });

      // Build a formatted MBTI summary with descriptions
      const getDescription = (letter: string | null): string => {
        const descriptions: Record<string, string> = {
          'E': 'Extroversion',
          'I': 'Introversion',
          'S': 'Sensing',
          'N': 'Intuition',
          'T': 'Thinking',
          'F': 'Feeling',
          'J': 'Judging',
          'P': 'Perceiving'
        };
        return letter ? descriptions[letter] || '' : '';
      };

      // Format the summary in the correct format with descriptions
      const formattedSummary = [
        selectedEI ? `${selectedEI} - ${getDescription(selectedEI)}` : '',
        selectedSN ? `${selectedSN} - ${getDescription(selectedSN)}` : '',
        selectedTF ? `${selectedTF} - ${getDescription(selectedTF)}` : '',
        selectedJP ? `${selectedJP} - ${getDescription(selectedJP)}` : ''
      ].filter(Boolean).join('\n');
      
      console.log('Updating with formatted summary:', formattedSummary);
      
      if (isEditMode && currentAssessmentId) {
        // We're in edit mode - update existing assessment
        showProgressMessage({
          type: 'info',
          text1: 'Updating assessment...',
          text2: '',
        });
        
        const updateResult = await assessmentViewModel.updateAssessment(
          currentAssessmentId,
          { assessment_summary: formattedSummary }
        );
        
        if (updateResult.isErr()) {
          throw new Error(updateResult.error.message);
        }
        
        setIsMemoryUpdated(true);
        showProgressMessage({
          type: 'success',
          text1: 'Assessment updated successfully',
          text2: '',
        });
        
        // Return to My Data screen
        setTimeout(() => router.push('/MyData'), 1000);
      } else {
        // We're in create mode - create new assessment
        showProgressMessage({
          type: 'info',
          text1: 'Submitting assessment...',
          text2: '',
        });

        const result = await assessmentVM?.submitAssessment();

        if (result.isErr()) {
          showProgressMessage({
            type: 'error',
            text1: 'Error',
            text2: result.error.message,
          });
          return;
        }
        
        setIsMemoryUpdated(true);
        showProgressMessage({
          type: 'success',
          text1: 'Assessment saved successfully',
          text2: '',
        });

        if (navigationVM.getFTUX()) {
          router.push(navigationVM.getRouteFor(FTUX_Routes.ChooseAssessment));
        } else {
          router.back();
        }
      }

      setIsSubmitting(false);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save assessment';
      showProgressMessage({
        type: 'error',
        text1: 'Error',
        text2: errorMessage,
      });
      setIsSubmitting(false);
    }
  }, [assessmentVM, selectedEI, selectedSN, selectedTF, selectedJP, isSubmitting, navigationVM]);

  const handleAboutMyResults = () => {
    console.log("Handle About My Results");
  }

  const handleRetake = () => {
    console.log("Handle Retake");
  }

  useEffect(() => {
    const unsubscribe = assessmentVM.isMemoryUpdated$.onChange((_) => {
      setIsMemoryUpdated(true);
    });

    const unsubscribes = [unsubscribe];

    // Subscribe to dichotomy changes from view model
    unsubscribes.push(
      assessmentVM.selectedDichotomies$.onChange((dichotomies) => {
        if (dichotomies.value.energy) {
          setSelectedEI(dichotomies.value.energy);
        }
        if (dichotomies.value.information) {
          setSelectedSN(dichotomies.value.information);
        }
        if (dichotomies.value.decision) {
          setSelectedTF(dichotomies.value.decision);
        }
        if (dichotomies.value.lifestyle) {
          setSelectedJP(dichotomies.value.lifestyle);
        }
      })
    );

    // Set initial dichotomy values from view model
    const initialDichotomies = assessmentVM.selectedDichotomies$.get();
    if (initialDichotomies) {
      if (initialDichotomies.energy) {
        setSelectedEI(initialDichotomies.energy);
      }
      if (initialDichotomies.information) {
        setSelectedSN(initialDichotomies.information);
      }
      if (initialDichotomies.decision) {
        setSelectedTF(initialDichotomies.decision);
      }
      if (initialDichotomies.lifestyle) {
        setSelectedJP(initialDichotomies.lifestyle);
      }
    }

    return () => {
      Promise.all(unsubscribes.map(unsub => unsub()));
    };
  }, [assessmentViewModel]);

  const PillDivider = () => (
    <View style={{
      width: 1,
      backgroundColor: customColors.black3,
      position: 'absolute',
      left: '50%',
      top: '20%',
      height: '60%',
      zIndex: 5,
      transform: [{ translateX: -0.5 }]
    }} />
  );

  const PillOption = React.memo(({
    value,
    label,
    selected,
    onSelect,
    pillType,
  }: {
    value: PersonalityDimension,
    label: string,
    selected: boolean,
    onSelect: (value: PersonalityDimension) => void,
    pillType?: string,
  }) => {
    const selectHandler = useCallback(() => {
      onSelect(value);
    }, [onSelect, value]);

    // Extract displayLabel for iOS to show a more compact label
    const displayLabel = Platform.OS === 'ios' 
      ? label.replace(/\s*\([A-Z]\)$/, '') // Remove the (X) suffix on iOS
      : label;

    return (
      <TouchableOpacity
        style={[
          assessmentStyles.pill,
          {
            ...selected && assessmentStyles.pillSelected,
            ...(pillType === 'left' && assessmentStyles.pillLeft),
            ...(pillType === 'right' && assessmentStyles.pillRight)
          }]}
        onPress={selectHandler}
      >
        <View style={{ width: '100%', alignItems: 'center', justifyContent: 'center' }}>
          {
            selected ? 
              <ButtonRegular noMargins noPadding center>{displayLabel}</ButtonRegular> : 
              <BodyRegular noMargins noPadding center>{displayLabel}</BodyRegular>
          }
        </View>
      </TouchableOpacity>
    );
  });

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

      <Text style={styles.title}>Myers Briggs (MBTI®)</Text>
      <Text style={styles.subtitle}>Myers & Briggs Foundation</Text>

      {/* Personality Type Sections */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Choose one</Text>
        <View style={assessmentStyles.pillGroup}>
          <PillOption
            value="E"
            label="Extraversion (E)"
            selected={selectedEI === 'E'}
            onSelect={() => setSelectedEI('E')}
            pillType='left'
          />
          <PillDivider />
          <PillOption
            value="I"
            label="Introversion (I)"
            selected={selectedEI === 'I'}
            onSelect={() => setSelectedEI('I')}
            pillType='right'
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Choose one</Text>
        <View style={assessmentStyles.pillGroup}>
          <PillOption
            value="S"
            label="Sensing (S)"
            selected={selectedSN === 'S'}
            onSelect={() => setSelectedSN('S')}
            pillType='left'
          />
          <PillDivider />
          <PillOption
            value="N"
            label="Intuition (N)"
            selected={selectedSN === 'N'}
            onSelect={() => setSelectedSN('N')}
            pillType='right'
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Choose one</Text>
        <View style={assessmentStyles.pillGroup}>
          <PillOption
            value="T"
            label="Thinking (T)"
            selected={selectedTF === 'T'}
            onSelect={() => setSelectedTF('T')}
            pillType='left'
          />
          <PillDivider />
          <PillOption
            value="F"
            label="Feeling (F)"
            selected={selectedTF === 'F'}
            onSelect={() => setSelectedTF('F')} 
            pillType='right'
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Choose one</Text>
        <View style={assessmentStyles.pillGroup}>
          <PillOption
            value="J"
            label="Judging (J)"
            selected={selectedJP === 'J'}
            onSelect={() => setSelectedJP('J')}
            pillType='left'
          />
          <PillDivider />
          <PillOption
            value="P"
            label="Perceiving (P)"
            selected={selectedJP === 'P'}
            onSelect={() => setSelectedJP('P')}
            pillType='right'
          />
        </View>
      </View>

      {/* Memory Updated Status */}
      {isMemoryUpdated && (
        <View style={styles.statusContainer}>
          <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
          <Text style={styles.statusText}>Memory updated</Text>
        </View>
      )}

      {/* Uploads Section */}
      <View style={assessmentStyles.uploadsContainer}>
        <Text style={assessmentStyles.uploadsTitle}>Your uploads</Text>
        <View style={assessmentStyles.uploadsContainer}>
          {assessmentVM?.uploadedFiles$.get().length === 0 ? (
            <>
              <Text style={assessmentStyles.uploadDescription}>
                Upload your MBTI® results as text, PDF, or image
              </Text>
              <TouchableOpacity style={assessmentStyles.uploadButton} onPress={handleFileUpload}>
                <Ionicons name="cloud-upload-outline" size={24} color="#000" />
                <Text style={assessmentStyles.uploadButtonText}>Upload results</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* TODO: Update this to match the design */}
              {assessmentVM?.uploadedFiles$.get().map((file) => (
                <View key={file.name} style={assessmentStyles.uploadItem}>
                  <Text style={assessmentStyles.uploadText}>{file.name}</Text>
                  <TouchableOpacity onPress={() => handleRemoveFile(file.name)}>
                    <Ionicons name="trash-outline" size={20} color="#666" />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity
                style={assessmentStyles.uploadMoreButton}
                onPress={handleFileUpload}
              >
                <Text style={assessmentStyles.uploadMoreText}>Upload more results</Text>
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
          <View style={styles.myDataButtonsContainer}>
            <TouchableOpacity
              style={assessmentStyles.submitButton}
              onPress={handleAboutMyResults}>
              <ButtonRegular color={customColors.white}>About my results</ButtonRegular>
            </TouchableOpacity>
            <TouchableOpacity
              style={assessmentStyles.submitButton}
              onPress={handleRetake}>
              <ButtonRegular color={customColors.white}>Re-Take the MBTI</ButtonRegular>
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
    backgroundColor: '#FAF9F6',
    padding: 20,
  },
  myDataButtonsContainer: {
    flexDirection: 'column',
    gap: 12,
    alignItems: 'center',
  },
  backButton: {
    marginBottom: 16,
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 12,
  },

  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
  },
  statusText: {
    color: '#4CAF50',
    fontSize: 16,
  },

});

export default MBTIScreen;
