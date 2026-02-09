import React from "react";
import { StyleSheet, FlatList } from "react-native";
import { View } from "react-native-ui-lib";
import { AboutYouSectionType, UserAboutYou } from "@src/models/UserAboutYou";
import { AboutYouEntryCard } from "./AboutYouEntryCard";
import HeartIcon from "../icons/HeartIcon";
import PeopleGroupIcon from "../icons/PeopleGroupIcon";
import CareerBriefCaseIcon from "../icons/CareerBriefCaseIcon";
import AboutYouTraitChip from "./AboutYouTraitChip";

interface AboutYouSectionProps {
    sectionType: AboutYouSectionType;
    entries: UserAboutYou[];
}

const getSectionConfig = (type: AboutYouSectionType) => {
    switch (type) {
        case AboutYouSectionType.SELF_AWARENESS:
            return {
                title: "Self-awareness",
                color: "#4CAF50",
                Icon: HeartIcon
            };
        case AboutYouSectionType.RELATIONSHIPS:
            return {
                title: "Relationships",
                color: "#FECF51",
                Icon: PeopleGroupIcon
            };
        case AboutYouSectionType.CAREER_DEVELOPMENT:
            return {
                title: "Career Development",
                color: "#2196F3",
                Icon: CareerBriefCaseIcon
            };
    }
};

export const AboutYouSection: React.FC<AboutYouSectionProps> = ({ sectionType, entries }) => {
    const { title, color, Icon } = getSectionConfig(sectionType);

    const renderItem = ({ item }: { item: UserAboutYou }) => (
        <View marginR-16>
            <AboutYouEntryCard entry={item} color={color} />
        </View>
    );

    return (
        <View style={styles.container}>
            <AboutYouTraitChip
                title={title}
                color={color}
                Icon={Icon}
            />
            <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={entries}
                renderItem={renderItem}
                keyExtractor={(item: UserAboutYou) => item.id}
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        gap: 12,
    },
    title: {
        marginBottom: 12,
    },
    listContent: {
        paddingHorizontal: 0,
        marginBottom: 20
    },
    traitChipContainer: {
        borderRadius: 40,
        paddingHorizontal: 8,
        paddingVertical: 8,
        gap: 8,
    },
    traitChipText: {
        fontSize: 12,
        fontFamily: 'WorkSansSemiBold',
        fontWeight: '600',
        letterSpacing: -0.16,
    }
}); 
