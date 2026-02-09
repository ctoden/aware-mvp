export interface AssessmentData {
    title: string;
    value: string;
    route?: string;
    onPress?: (item: AssessmentData) => void;
    id?: string; // Adding id to help identify the assessment
}

export interface PersonalData {
    title: string;
    value: string;
    route?: string;
    onPress?: (item: PersonalData) => void;
}

export interface DemographicData {
    title: string;
    value: string;
    isAddButton?: boolean;
    route?: string;
    onPress?: (item: DemographicData) => void;
}

export interface CareerData {
    title: string;
    value: string;
    isAddButton?: boolean;
    route?: string;
    onPress?: (item: CareerData) => void;
}

export interface DataItemProps {
    title: string;
    value: string;
    isAddButton?: boolean;
    isLast?: boolean;
    route?: string;
    onPress?: (item: any) => void;
}