import { FC } from "react";
import { SvgProps } from "react-native-svg";

export interface SimpleListCardProps {
    title: string;
    description: string;
    IconComponent?: FC<SvgProps>;
}

export interface SimpleListProps {
    listTitle: string;
    simpleListItems: SimpleListCardProps[];
}