import { Observable, observable } from "@legendapp/state";
import { LifeCycleConfig } from "@src/core/lifecycle/LifeCycleManager";
import { BR_TRUE } from "@src/utils/NeverThrowUtils";
import { Result, err } from "neverthrow";
import { injectable } from "tsyringe";
import { AppRoute, NavigationModel, navigationModel, ScreenRoutes, Layouts, FTUX_Routes, routeToString } from '../models/NavigationModel';
import { isAuthenticated$ } from '../models/SessionModel';
import { userAssessments$ } from '../models/UserAssessment';
import { ViewModel } from './ViewModel';
import { FtuxService } from "@src/services/FtuxService";
import { ftuxState$ } from "@src/models/FtuxModel";
import { AuthService } from "@src/services/AuthService";

@injectable()
export class NavigationViewModel extends ViewModel {
    private readonly _ftuxService: FtuxService;
    private readonly _authService: AuthService;
    public readonly isFTUX$ = observable(false);
    public readonly isMyData$ = observable(false);

    // Computed property to determine the current route
    public readonly currentRoute$ = observable(() => {
        return this.handleOnChange();
    });

    constructor() {
        super("NavigationViewModel");
        this._ftuxService = this.addDependency(FtuxService);
        this._authService = this.addDependency(AuthService);
    }

    protected async onInitialize?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        // Initialize isFTUX$ based on FtuxService (using FTUX flow completion, not intro)
        this.isFTUX$.set(!this._ftuxService.isFtuxCompleted());

        // Set up a model change listener to keep isFTUX$ in sync with the FtuxService state
        this.onChange(ftuxState$.hasCompletedFTUX, () => {
            this.isFTUX$.set(!this._ftuxService.isFtuxCompleted());
        });

        return BR_TRUE;
    }

    protected async onEnd?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        return BR_TRUE;
    }

    get navigation(): Observable<NavigationModel> {
        return navigationModel;
    }

    getCurrentLayout(): string {
        const isLargeScreen = navigationModel.isLargeScreen.get();
        const layout = isLargeScreen ? Layouts.Navbar : Layouts.Tabs;
        console.log(`[NAV-DEBUG] Getting current layout: isLargeScreen=${isLargeScreen}, layout=${layout}`);
        return layout;
    }

    updateScreenSize(screenWidth: number): void {
        const breakpoint = navigationModel.breakpoint.get();
        const isLarge = screenWidth >= breakpoint;
        console.log(`[NAV-DEBUG] Screen width: ${screenWidth}, Breakpoint: ${breakpoint}, Is large screen: ${isLarge}`);
        navigationModel.isLargeScreen.set(isLarge);
    }

    freezeRoute(): void {
        navigationModel.frozenRoute.set(this.currentRoute$.get());
    }

    unfreezeRoute(): void {
        navigationModel.frozenRoute.set(null);
    }

    protected handleOnChange(): AppRoute {
        let route: AppRoute;

        if (navigationModel.frozenRoute.get()) {
            route = navigationModel.frozenRoute.get()!;
            console.log(`[NAV-DEBUG] handleOnChange: Using frozen route: ${route}`);
            return route;
        }

        // Check if intro needs to be shown - this is separate from FTUX
        if (!this._ftuxService.isIntroCompleted()) {
            route = FTUX_Routes.Intro;
            console.log(`[NAV-DEBUG] handleOnChange: Intro not completed, route: ${route}`);
            return route;
        }

        // If not authenticated, return Auth screen
        if (!isAuthenticated$.get()) {
            route = FTUX_Routes.Auth;
            console.log(`[NAV-DEBUG] handleOnChange: Not authenticated, route: ${route}`);
            return route;
        }

        // Now handle the post-authentication flow

        // Check if FTUX flow has been completed
        if (!this._ftuxService.isFtuxCompleted()) {
            route = FTUX_Routes.Welcome;
            console.log(`[NAV-DEBUG] handleOnChange: FTUX not completed, route: ${route}`);
            return route;
        }

        // If FTUX is done but no assessments, check if we're loading data
        const assessments = userAssessments$.get();
        if (!assessments || assessments.length === 0) {
            // User is authenticated and has completed FTUX but has no assessments
            // This is potentially a condition where the app is still loading data
            // Let them go to the Chat screen as the default
            route = ScreenRoutes.Chat;
            console.log(`[NAV-DEBUG] handleOnChange: No assessments, route: ${route}`);
            return route;
        }

        // FTUX completed and user has assessments, show Chat screen as default
        route = ScreenRoutes.Chat;
        console.log(`[NAV-DEBUG] handleOnChange: Default case, route: ${route}`);
        return route;
    }

    getRouteFor(route: AppRoute): string {
        const wrappedRoutes = Object.values(ScreenRoutes);
        const isWrappedRoute = wrappedRoutes.includes(route as ScreenRoutes);
        const layout = isWrappedRoute ? this.getCurrentLayout() : null;
        const fullRoute = isWrappedRoute ? `${layout}/${routeToString(route)}` : routeToString(route);

        console.log(`[NAV-DEBUG] getRouteFor: route=${route}, isWrappedRoute=${isWrappedRoute}, layout=${layout}, fullRoute=${fullRoute}`);

        return fullRoute;
    }

    // Force navigation to next appropriate route
    navigateNext(): AppRoute {
        // Trigger a re-computation of currentRoute$
        this.currentRoute$.get();
        return this.currentRoute$.get();
    }

    navigateToBirthDate(): void {
        navigationModel.frozenRoute.set(this.getRouteFor(FTUX_Routes.BirthDate));
    }

    navigateToDebugMenu(): void {
        navigationModel.frozenRoute.set(this.getRouteFor(ScreenRoutes.DebugMenu));
    }

    navigateToMyData(): void {
        navigationModel.frozenRoute.set(this.getRouteFor(ScreenRoutes.MyData));
    }

    navigateToIndex(): void {
        // Reset isMyData flag when navigating back to index
        this.isMyData$.set(false);
        navigationModel.frozenRoute.set(this.getRouteFor(ScreenRoutes.Index));
    }

    setFTUX(isFTUX: boolean) {
        // Update FTUX state using the service (using FTUX flow completion, not intro)
        this._ftuxService.setFtuxCompleted(!isFTUX)
            .then((result) => {
                if (result.isErr()) {
                    console.error('Error updating FTUX state:', result.error);
                }
            });

        // Local state should be updated through the onChange handler
        // when ftuxState$ changes, not directly
    }

    getFTUX(): boolean {
        return this.isFTUX$.get();
    }

    setIsMyData(isMyData: boolean) {
        this.isMyData$.set(isMyData);
    }

    getIsMyData(): boolean {
        return this.isMyData$.get();
    }

    /**
     * Logs the user out of the application and handles all related state changes
     * @param preserveUserData Optional flag to preserve user data during logout (default: false)
     * @returns A promise that resolves to a Result indicating success or failure
     */
    async logout(preserveUserData: boolean = false): Promise<Result<boolean, Error>> {
        console.log("~~~ NavigationViewModel: Initiating logout process");
        try {
            // 1. Reset navigation and FTUX state
            this.setFTUX(true);
            this.setIsMyData(false);
            this.navigation.frozenRoute.set(FTUX_Routes.Auth);

            // 2. Perform the actual logout through auth service
            const result = await this._authService.signOut(preserveUserData);
            if (result.isErr()) {
                throw new Error(result.error.message);
            }

            // 3. Schedule unfreezing the route after a short delay to allow navigation to complete
            setTimeout(() => {
                console.log("~~~ NavigationViewModel: Unfreezing route after logout");
                this.unfreezeRoute();
            }, 500);

            console.log("~~~ NavigationViewModel: Logout completed successfully");
            return result;
        } catch (error) {
            console.error('~~~ NavigationViewModel: Error during logout:', error);
            return err(error instanceof Error ? error : new Error(`Unknown error: ${String(error)}`));
        }
    }

    // Method to get the previous route in the FTUX flow
    getFTUXPreviousRoute(currentRoute: FTUX_Routes): FTUX_Routes | null {
        const ftuxFlow = [
            FTUX_Routes.Welcome,
            FTUX_Routes.MainInterests,
            FTUX_Routes.ChooseAssessment,
            FTUX_Routes.AlmostDone,
            FTUX_Routes.BirthDate,
            FTUX_Routes.UltimateGoals,
            FTUX_Routes.ShortTermGoals,
            FTUX_Routes.AddRelationships,
            FTUX_Routes.AddFamilyStory,
            FTUX_Routes.PrimaryOccupation,
            FTUX_Routes.CareerJourney,
            FTUX_Routes.IntroducingYou
        ];

        const currentIndex = ftuxFlow.indexOf(currentRoute);
        if (currentIndex <= 0) {
            return null; // No previous route, or not in the flow
        }

        return ftuxFlow[currentIndex - 1];
    }

    // Method to navigate to the previous route in the FTUX flow
    navigateToPreviousFTUXRoute(currentRoute: FTUX_Routes): void {
        const previousRoute = this.getFTUXPreviousRoute(currentRoute);
        if (previousRoute) {
            navigationModel.frozenRoute.set(this.getRouteFor(previousRoute));
        } else {
            // If no previous route, navigate to the index page
            this.navigateToIndex();
        }
    }

    // Method to navigate directly to the IntroducingYou screen
    navigateToIntroducingYou(): void {
        navigationModel.frozenRoute.set(this.getRouteFor(FTUX_Routes.IntroducingYou));
    }
}