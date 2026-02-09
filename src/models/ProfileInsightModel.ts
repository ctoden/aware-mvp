import { observable } from '@legendapp/state';
import { customColors } from '@app/constants/theme';

export interface ProfileInsight {
  category: string;
  title: string;
  backgroundColor: string;
  content: {
    overview: string;
    whatItMeansForMe: string;
  };
}

// Create a shared observable for the profile insight
export const selectedProfileInsight$ = observable<ProfileInsight | null>(null);

// Function to set the selected profile insight
export function setSelectedProfileInsight(insight: ProfileInsight): void {
  selectedProfileInsight$.set(insight);
}

// Default content that will be used for all trait cards initially
const defaultAssertiveCommunicationContent = {
  overview: 'People who have an assertive communication style express their thoughts, feelings, and needs directly and confidently, while showing respect for the perspectives and boundaries of others. Unlike passive communicators, they do not avoid conflict or fail to voice their needs. They differ from passive-aggressive communicators by addressing concerns openly instead of relying on indirect or sarcastic methods. Unlike aggressive communicators, they prioritize collaboration and fairness over overpowering others or imposing their will.',
  whatItMeansForMe: 'Since you tend to have an assertive communication style, your ability to articulate big ideas with confidence and clarity makes you a natural leader. However, your competitive and commanding nature might occasionally come across as overly intense, especially when you\'re laser-focused on winning or achieving a goal. Take a breath and ensure you\'re balancing your drive with a touch of humility and curiosity. Asking others for their perspectives not only enriches your strategies but also shows that you value their input—which can transform followers into loyal collaborators.'
}; 