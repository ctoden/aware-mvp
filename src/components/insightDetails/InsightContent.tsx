import React, { FC } from 'react';
import { View, Text } from 'react-native-ui-lib';
import { InsightArticleSection } from '@src/actions/aboutYou/GenerateInsightArticleAction';
import { customColors } from '@app/constants/theme';

interface InsightContentProps {
    introduction: string;
    sections: InsightArticleSection[];
}

export const InsightContent: FC<InsightContentProps> = ({ introduction, sections }) => {
    return (
        <View>
            <Text style={{ color: customColors.black2 }} bodyL marginB-s6>
                {introduction}
            </Text>

            {sections.map((section, index) => (
                <View key={index} marginB-s6>
                    <Text h4 marginB-s2 style={{ color: customColors.black1 }}>
                        {section.heading}
                    </Text>
                    <Text bodyL style={{ color: customColors.black2 }}>
                        {section.content}
                    </Text>
                </View>
            ))}
        </View>
    );
}; 