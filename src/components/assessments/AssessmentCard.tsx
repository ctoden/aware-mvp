import React, { FC } from 'react';
import { View, Image } from 'react-native-ui-lib';
import { ReactiveText } from '@src/components/ReactiveText';
import themeObject, { customColors } from '@app/constants/theme';
import { observable } from '@legendapp/state';
import { UserAssessment } from '@src/models/UserAssessment';

interface AssessmentCardProps {
  assessment: UserAssessment;
}

const mapAssessmentTypeToIcon: Record<string, string> = {
  "mbti": require('@assets/images/mbti.png'),
  "big5": require('@assets/images/bigfive.png'),
  "cliftonstrengths": require('@assets/images/cliftonstrengths.png'),
  "love-language": require('@assets/images/love-language.png'),
};

export const AssessmentCard: FC<AssessmentCardProps> = ({ assessment }) => {
  return (
    <View
      br40
      backgroundColor={themeObject.colors.backgroundLight}
      style={{
        backgroundColor: customColors.beige2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      <View 
            style={{ 
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              backgroundColor: customColors.beige3,
              padding: 16,
              width: '100%',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
        <Image 
          source={mapAssessmentTypeToIcon[assessment.assessment_type.toLowerCase()]} 
          style={{ height: 22, resizeMode: 'contain' }} 
        />
      </View>

      <View marginB-s4 paddingL-s4 paddingR-s4 paddingT-s4>
        <ReactiveText 
          text$={observable(assessment.assessment_type)}
          style={themeObject.typography.h4}
          marginB-s4
        />
        
        <ReactiveText 
          text$={observable(assessment.assessment_summary ?? '')}
          style={themeObject.typography.bodyL}
        />
      </View>
    </View>
  );
};

AssessmentCard.displayName = 'AssessmentCard'; 