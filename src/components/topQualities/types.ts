export interface QualityProps {
    title: string;
    level: string;
    description: string;
    color: string;
    isHighLevel: boolean;
}

export interface QualityCardProps {
    quality: QualityProps;
}