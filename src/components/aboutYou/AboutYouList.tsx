import React from "react";
import { StyleSheet } from "react-native";
import { View, Text } from "react-native-ui-lib";
import { useViewModel } from "@src/hooks/useViewModel";
import { AboutYouViewModel } from "@src/viewModels/AboutYouViewModel";
import { AboutYouSection } from "./AboutYouSection";
import { useObservable } from "@legendapp/state/react";
import { AboutYouSectionType } from "@src/models/UserAboutYou";
import { H2 } from "../text/H2";

export const AboutYouList: React.FC = () => {
    const { viewModel } = useViewModel(AboutYouViewModel);
    const selfAwarenessEntries = useObservable(viewModel.getSelfAwarenessEntries$);
    const relationshipsEntries = useObservable(viewModel.getRelationshipsEntries$);
    const careerDevelopmentEntries = useObservable(viewModel.getCareerDevelopmentEntries$);

    return (
        <View style={styles.container}>
            <View style={styles.headerWrapper}>
                <H2>About you</H2>
            </View>
            <View style={styles.sectionsContainer}>
                <AboutYouSection 
                    sectionType={AboutYouSectionType.SELF_AWARENESS}
                    entries={selfAwarenessEntries.map(entry => entry.get())} 
                />
                <AboutYouSection 
                    sectionType={AboutYouSectionType.RELATIONSHIPS}
                    entries={relationshipsEntries.map(entry => entry.get())} 
                />
                <AboutYouSection 
                    sectionType={AboutYouSectionType.CAREER_DEVELOPMENT}
                    entries={careerDevelopmentEntries.map(entry => entry.get())} 
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerWrapper: {
        marginBottom: 16,
    },
    heading: {
        fontSize: 24,
        fontWeight: "600",
    },
    sectionsContainer: {
        flex: 1,
    },
}); 