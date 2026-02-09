import { Ionicons } from "@expo/vector-icons";
import { observer } from "@legendapp/state/react";
import { useViewModel } from "@src/hooks/useViewModel";
import { NavigationViewModel } from "@src/viewModels/NavigationViewModel";
import { UserMainInterestViewModel } from "@src/viewModels/UserMainInterestViewModel";
import * as React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { Colors, Text, TouchableOpacity, View } from "react-native-ui-lib";
import { MainInterestsHeader } from "./MainInterestsHeader";
import { MainInterestsList } from "./MainInterestsList";
import { FTUX_Routes } from "@src/models/NavigationModel";
import { router } from "expo-router";
import typography from "react-native-ui-lib/src/style/typography";

export const MainInterestsScreen: React.FC = observer(() => {
    const { viewModel: navigationVM } = useViewModel(NavigationViewModel);
    const { viewModel: mainInterestsVM } = useViewModel(UserMainInterestViewModel);
    const isEnabled = mainInterestsVM.isEnabled$.get();

    console.log("~~~ [MI] Interestes: ", mainInterestsVM.getUserMainInterests());
    console.log("~~~ [MI] isEnabled: ", isEnabled);

    return (
        <View style={styles.container} flex padding-page>
            {
                !navigationVM.getIsMyData() ? (
                    <View row spread paddingH-20 paddingT-20>
                        <TouchableOpacity onPress={() => { navigationVM.navigateToPreviousFTUXRoute(FTUX_Routes.MainInterests) }}>
                            <Text buttonRegular>
                                Back
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => navigationVM.navigateToMyData}>
                            <Text buttonRegular>
                                Done
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View row spread >
                        <TouchableOpacity onPress={() => router.back()}>
                            <Text style={typography.bodyLBold}>
                                Cancel
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => navigationVM.navigateToMyData}>
                            <Text style={[typography.bodyLBold]}>
                                    Done
                            </Text>
                        </TouchableOpacity>
                    </View>
                )
            }

            <View style={styles.header}>
                <MainInterestsHeader isMyData={navigationVM.getIsMyData()} />
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <MainInterestsList />
            </ScrollView>

            {!navigationVM.getIsMyData() &&
                (
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.doneButton, !isEnabled && styles.doneButtonDisabled]}
                        onPress={() => navigationVM.navigateToBirthDate()}
                        disabled={!isEnabled}
                    >
                        <Text style={[styles.doneButtonText, !isEnabled && styles.doneButtonTextDisabled]}>Continue</Text>
                        <Ionicons name="arrow-forward" size={20} color={isEnabled ? "#FFF" : "#999"} />
                    </TouchableOpacity>
                </View>
                )
            }
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.backgroundLight,
        width: "100%",
    },
    header: {
        paddingTop: 20,
    },
    scrollView: {
        flex: 1,
        width: "100%",
    },
    scrollContent: {
        marginTop: -15,
    },
    footer: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        backgroundColor: Colors.backgroundLight,
    },
    doneButton: {
        backgroundColor: '#000',
        marginTop: 20,
        padding: 16,
        borderRadius: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    doneButtonDisabled: {
        backgroundColor: '#E0E0E0',
    },
    doneButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '500',
    },
    doneButtonTextDisabled: {
        color: '#999',
    },
});

export default MainInterestsScreen;