import { UserAssessment } from '../UserAssessment';

export interface MBTIDichotomies {
    energy: 'I' | 'E' | null;       // Dimension for Introversion/Extraversion
    information: 'S' | 'N' | null;  // Dimension for Sensing/Intuition
    decision: 'T' | 'F' | null;     // Dimension for Thinking/Feeling
    lifestyle: 'J' | 'P' | null;    // Dimension for Judging/Perceiving
}

export const defaultMBTIDichotomies: MBTIDichotomies = {
    energy: null,
    information: null,
    decision: null,
    lifestyle: null
};

export const createDichotomies = (dichotomies: MBTIDichotomies = defaultMBTIDichotomies): MBTIDichotomies => {
    return {
        energy: dichotomies.energy,
        information: dichotomies.information,
        decision: dichotomies.decision,
        lifestyle: dichotomies.lifestyle
    };
};

// TODO: make observable
export class MbtiAssessment implements UserAssessment {
    id: string;
    user_id: string;
    name: string;
    assessment_type: string;
    assessment_full_text: string | null;
    assessment_summary: string | null;
    created_at: string | null;
    updated_at: string | null;
    dichotomies: MBTIDichotomies;
    
    constructor(data: UserAssessment, dichotomies: MBTIDichotomies = defaultMBTIDichotomies) {
        this.id = data.id;
        this.user_id = data.user_id;
        this.name = data.name;
        this.assessment_type = data.assessment_type;
        this.assessment_full_text = data.assessment_full_text;
        this.assessment_summary = data.assessment_summary;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
        this.dichotomies = dichotomies;
    }

    // You can add methods here
    getSummary(): string {
        return this.assessment_summary || 'No summary available';
    }

    getFullText(): string {
        return this.assessment_full_text || 'No full text available';
    }

    getDichotomies(): MBTIDichotomies {
        return this.dichotomies;
    }

    setDichotomies(dichotomies: MBTIDichotomies): void {
        this.dichotomies = dichotomies;
    }

    setEnergy(energy: 'I' | 'E'): void {
        this.dichotomies.energy = energy;
    }

    setInformation(information: 'S' | 'N'): void {
        this.dichotomies.information = information;
    }

    setDecision(decision: 'T' | 'F'): void {
        this.dichotomies.decision = decision;
    }

    setLifestyle(lifestyle: 'J' | 'P'): void {
        this.dichotomies.lifestyle = lifestyle;
    }
}