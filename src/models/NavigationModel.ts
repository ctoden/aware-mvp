import { observable } from '@legendapp/state'

export enum AuthRoutes {
    SignUp = 'SignUp',
    SignIn = 'SignIn'
}

export enum FTUX_Routes {
    Intro = 'Intro',
    Auth = 'Auth',
    Welcome = 'Welcome',
    IntroducingYou = 'IntroducingYou',
    BirthDate = 'BirthDate',
    MainInterests = 'MainInterests',
    AlmostDone = 'AlmostDone',
    UltimateGoals = 'UltimateGoals',
    ShortTermGoals = 'ShortTermGoals',
    AddRelationships = 'AddRelationships',
    AddFamilyStory = 'AddFamilyStory',
    PrimaryOccupation = 'PrimaryOccupation',
    CareerJourney = 'CareerJourney',
    ChooseAssessment = 'ChooseAssessment',
    MBTI = 'MBTI',
    BigFive = 'BigFive',
    CliftonStrengths = 'CliftonStrengths',
    Disc = 'Disc',
    Enneagram = 'Enneagram',
    LoveLanguages = 'LoveLanguages',
    MotivationCode = 'MotivationCode',
    AddAvatar = 'AddAvatar',
    AssessmentDetails = 'AssessmentDetails',
    Education = 'Education',
}

export enum Layouts {
    Navbar = '(navbar)',
    Tabs = '(tabs)'
}

export enum ScreenRoutes {
    Chat = 'Chat',
    ChatList = 'ChatList',
    Explore = 'Explore',
    Index = '',
    People = 'People',
    Circles = 'Circles',
    DebugMenu = 'DebugMenu',
    InsightDetails = 'InsightDetails',
    MyData = 'MyData'
}

export type AppRoute = AuthRoutes | FTUX_Routes | Layouts | ScreenRoutes | string;

export interface NavigationModel {
    isLargeScreen: boolean;
    breakpoint: number;
    frozenRoute: AppRoute | null;
}

// Using 600px as breakpoint since that's where mobile landscape ends
// and tablet portrait begins according to our requirements
export const navigationModel = observable<NavigationModel>({
    isLargeScreen: true,
    breakpoint: 600,
    frozenRoute: null
});

// Log the initial values
console.log(`[NAV-DEBUG] NavigationModel initialized: isLargeScreen=${navigationModel.isLargeScreen.get()}, breakpoint=${navigationModel.breakpoint.get()}`);

// Utility function to convert enum value to string
export function routeToString(route: AppRoute): string {
    return route.toString();
}
