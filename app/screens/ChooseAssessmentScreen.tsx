import { Ionicons } from '@expo/vector-icons';
import { observer } from '@legendapp/state/react';
import { ChangeType, emitChange } from '@src/events/ChangeEvent';
import { useViewModel } from '@src/hooks/useViewModel';
import { FTUX_Routes } from "@src/models/NavigationModel";
import { userAssessments$ } from "@src/models/UserAssessment";
import { AssessmentViewModel } from '@src/viewModels/AssessmentViewModel';
import { NavigationViewModel } from '@src/viewModels/NavigationViewModel';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import Toast from 'react-native-toast-message';
import { Spacings } from 'react-native-ui-lib';
import colors from 'react-native-ui-lib/src/style/colors';
import typography from 'react-native-ui-lib/src/style/typography';

const ChooseAssessmentScreen: React.FC = observer(() => {
  const router = useRouter();
  const { viewModel: assessmentVM } = useViewModel(AssessmentViewModel);
  const { viewModel: navigationVM } = useViewModel(NavigationViewModel);
  const userAssessments = userAssessments$.get();
  const [initialAssessmentsCount, setInitialAssessments] = useState(userAssessments.length);
  const [isSubmitEnabled, setIsSubmitEnabled] = useState(false);
  const hasMBTI = userAssessments.some(s => s.assessment_type === 'MBTI');
  const hasBigFive = userAssessments.some(s => s.assessment_type === 'BigFive');
  const hasCliftonStrengths = userAssessments.some(s => s.assessment_type === 'CliftonStrengths');
  const hasDisc = userAssessments.some(s => s.assessment_type === 'DISC');
  const hasLoveLanguages = userAssessments.some(s => s.assessment_type === 'LoveLanguages');
  const hasMotivationCode = userAssessments.some(s => s.assessment_type === 'MotivationCode');
  const isFTUX = navigationVM.isFTUX$.peek();

  useEffect(() => {
    setIsSubmitEnabled(userAssessments.length !== initialAssessmentsCount);
  }, [userAssessments.length, initialAssessmentsCount]);

  const showToast = () => {
    Toast.show({
      type: 'info',
      text1: 'Coming Soon',
      text2: 'This assessment is not implemented yet',
      position: 'bottom',
      visibilityTime: 2000,
    });
  };

  const handleContinue = () => {
    emitChange(ChangeType.USER_PROFILE_GENERATE_SUMMARY, { source: 'ChooseAssessmentScreen' }, 'user_action');

    if (isFTUX) {
      router.push(navigationVM.getRouteFor(FTUX_Routes.AlmostDone));
    } else {
      navigationVM.navigateToIndex();
    }
  };

  const handleDeleteAssessment = async (id: string) => {
    try {
      await assessmentVM?.deleteAssessment(id);
      Toast.show({
        type: 'success',
        text1: 'Assessment deleted successfully',
        position: 'bottom',
        visibilityTime: 2000,
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error deleting assessment',
        position: 'bottom',
        visibilityTime: 2000,
      });
    }
  };

  const handleCancel = () => {
    if (isFTUX) {
      navigationVM.navigateToPreviousFTUXRoute(FTUX_Routes.ChooseAssessment);
    } else {
      router.back();
    }
  };

  const titleCopy = isFTUX ? "Choose another assessment" : "Add an assessment";

  return (
    <ScrollView>

      {/* Header */}
      {!isFTUX && (
        <View style={[styles.topBar, styles.rowSpread]}>
          <TouchableOpacity onPress={handleCancel}>
            <Text style={typography.bodyLBold}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleContinue}
            disabled={!isSubmitEnabled}
          >
            <Text style={[
              typography.bodyLBold,
              { color: isSubmitEnabled ? colors.textPrimary : colors.textSecondary }
            ]}>
              Done
            </Text>
          </TouchableOpacity>
        </View>)
      }
      <View style={styles.container}>
        {userAssessments.length === 0 ? (
          <>
            <Text style={styles.title}>{titleCopy}</Text>
            <Text style={styles.description}>
              The more you add, the smarter Aware gets.{'\n'}
              Please submit the results from at least one assessment before continuing.
            </Text>
          </>
        ) : (
          <Text style={styles.title}>{titleCopy}</Text>
        )}

        <View style={styles.assessmentList}>
          <TouchableOpacity
            style={styles.assessmentItem}
            onPress={() => router.push(navigationVM.getRouteFor(FTUX_Routes.CliftonStrengths))}
          >
            <Image
              source={require('@assets/images/cliftonstrengths.png')}
              style={styles.logo}
            />
            <View style={styles.assessmentNameContainer}>
              <Text style={styles.assessmentName}>CliftonStrengths®</Text>
              {hasCliftonStrengths && (
                <View style={styles.assessmentStatusContainer}>
                  <Ionicons name="checkmark" size={20} color="#4CAF50" />
                  <TouchableOpacity
                    onPress={() => {
                      const cliftonStrengthsSummary = userAssessments.find(s => s.assessment_type === 'CliftonStrengths');
                      if (cliftonStrengthsSummary) {
                        handleDeleteAssessment(cliftonStrengthsSummary.id);
                      }
                    }}
                  >
                    <Ionicons name="trash-outline" size={20} color="#666" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.assessmentItem}
            onPress={() => router.push(navigationVM.getRouteFor(FTUX_Routes.Enneagram))}
          >
            <Image
              source={require('@assets/images/enneagram.png')}
              style={styles.logo}
            />
            <Text style={styles.assessmentName}>Enneagram</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.assessmentItem}
            onPress={() => router.push(navigationVM.getRouteFor(FTUX_Routes.MBTI))}
          >
            <Image
              source={require('@assets/images/mbti.png')}
              style={styles.logo}
            />
            <View style={styles.assessmentNameContainer}>
              <Text style={styles.assessmentName}>Myers Briggs (MBTI®)</Text>
              {hasMBTI && (
                <View style={styles.assessmentStatusContainer}>
                  <Ionicons name="checkmark" size={20} color="#4CAF50" />
                  <TouchableOpacity
                    onPress={() => {
                      const mbtiSummary = userAssessments.find(s => s.assessment_type === 'MBTI');
                      if (mbtiSummary) {
                        handleDeleteAssessment(mbtiSummary.id);
                      }
                    }}
                  >
                    <Ionicons name="trash-outline" size={20} color="#666" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.assessmentItem}
            onPress={() => router.push(navigationVM.getRouteFor(FTUX_Routes.BigFive))}
          >
            <Image
              source={require('@assets/images/bigfive.png')}
              style={styles.logo}
            />
            <View style={styles.assessmentNameContainer}>
              <Text style={styles.assessmentName}>Big Five Personality</Text>
              {hasBigFive && (
                <View style={styles.assessmentStatusContainer}>
                  <Ionicons name="checkmark" size={20} color="#4CAF50" />
                  <TouchableOpacity
                    onPress={() => {
                      const bigFiveSummary = userAssessments.find(s => s.assessment_type === 'BigFive');
                      if (bigFiveSummary) {
                        handleDeleteAssessment(bigFiveSummary.id);
                      }
                    }}
                  >
                    <Ionicons name="trash-outline" size={20} color="#666" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.assessmentItem}
            onPress={() => router.push(navigationVM.getRouteFor(FTUX_Routes.Disc))}
          >
            <Image
              source={require('@assets/images/disc.png')}
              style={styles.logo}
            />
            <View style={styles.assessmentNameContainer}>
              <Text style={styles.assessmentName}>DiSC®</Text>
              {hasDisc && (
                <View style={styles.assessmentStatusContainer}>
                  <Ionicons name="checkmark" size={20} color="#4CAF50" />
                  <TouchableOpacity
                    onPress={() => {
                      const discSummary = userAssessments.find(s => s.assessment_type === 'DISC');
                      if (discSummary) {
                        handleDeleteAssessment(discSummary.id);
                      }
                    }}
                  >
                    <Ionicons name="trash-outline" size={20} color="#666" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.assessmentItem}
            onPress={() => router.push(navigationVM.getRouteFor(FTUX_Routes.LoveLanguages))}
          >
            <Image
              source={require('@assets/images/love-language.png')}
              style={styles.logo}
            />
            <View style={styles.assessmentNameContainer}>
              <Text style={styles.assessmentName}>Love Languages</Text>
              {hasLoveLanguages && (
                <View style={styles.assessmentStatusContainer}>
                  <Ionicons name="checkmark" size={20} color="#4CAF50" />
                  <TouchableOpacity
                    onPress={() => {
                      const loveLanguagesSummary = userAssessments.find(s => s.assessment_type === 'LoveLanguages');
                      if (loveLanguagesSummary) {
                        handleDeleteAssessment(loveLanguagesSummary.id);
                      }
                    }}
                  >
                    <Ionicons name="trash-outline" size={20} color="#666" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.assessmentItem}
            onPress={() => router.push(navigationVM.getRouteFor(FTUX_Routes.MotivationCode))}
          >
            <Image
              source={require('@assets/images/mcode.png')}
              style={styles.logo}
            />
            <View style={styles.assessmentNameContainer}>
              <Text style={styles.assessmentName}>Motivation Code</Text>
              {hasMotivationCode && (
                <View style={styles.assessmentStatusContainer}>
                  <Ionicons name="checkmark" size={20} color="#4CAF50" />
                  <TouchableOpacity
                    onPress={() => {
                      const motivationCodeSummary = userAssessments.find(s => s.assessment_type === 'MotivationCode');
                      if (motivationCodeSummary) {
                        handleDeleteAssessment(motivationCodeSummary.id);
                      }
                    }}
                  >
                    <Ionicons name="trash-outline" size={20} color="#666" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {userAssessments.length > 0 && isFTUX && (
          <TouchableOpacity
            style={styles.doneButton}
            onPress={handleContinue}
          >
            <Text style={styles.doneButtonText}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFF" />
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    flex: 1,
    padding: 20,
    backgroundColor: '#FAF9F6',
    bottom: 0,
  },
  topBar: {
    padding: Spacings.s4,
    marginBottom: 8,
  },
  rowSpread: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    lineHeight: 22,
  },
  assessmentList: {
    flexDirection: 'column',
    width: '100%',
    paddingBottom: 20,
    gap: 12,
  },
  assessmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFEDE8',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  logo: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  assessmentNameContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assessmentName: {
    fontSize: 16,
    fontWeight: '500',
  },
  assessmentStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  doneButton: {
    marginTop: 12,
    position: 'relative',
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  doneButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ChooseAssessmentScreen;