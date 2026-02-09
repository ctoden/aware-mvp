export interface AssessmentData {
    title: string;
    value: string;
  }
  
  export interface AssessmentCardProps {
    assessment: AssessmentData;
    isLast?: boolean;
  }