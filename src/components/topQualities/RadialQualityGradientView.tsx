import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { RadialQualityGradient } from '@src/components/RadialQualityGradient';
import { useViewModel } from '@src/hooks/useViewModel';
import { RadialQualityGradientViewModel } from '@src/viewModels/topQualities/RadialQualityGradientViewModel';
import { Colors, Spacings, Typography } from 'react-native-ui-lib';
import { generateUUID } from '@src/utils/UUIDUtil';

export interface GradientStop {
  offset: string;
  color: string;
  opacity: number;
}

export interface RadialQualityGradientViewProps {
  size?: number;
  showLegend?: boolean;
  onPress?: () => void;
  gradientStops?: GradientStop[];
  uniqueId?: string;
}

export const RadialQualityGradientView: React.FC<RadialQualityGradientViewProps> = ({
  size = 150,
  showLegend = true,
  onPress,
  gradientStops,
  uniqueId,
}) => {
  const { viewModel, isInitialized, error: viewModelError } = useViewModel<RadialQualityGradientViewModel>(RadialQualityGradientViewModel);
  // Generate a unique ID for this instance if not provided
  const generatedUniqueId = uniqueId || `gradient-${generateUUID()}`;

  useEffect(() => {
    // Load qualities if not already loaded
    if (isInitialized && viewModel.topQualities.length === 0 && !viewModel.isLoading) {
      viewModel.loadTopQualities();
    }
  }, [viewModel, isInitialized]);

  if (!isInitialized || viewModel.isLoading) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (viewModelError || viewModel.error) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <Text style={styles.errorText}>Unable to load qualities</Text>
      </View>
    );
  }

  // Get top 3 qualities for the legend
  const topThreeQualities = [...viewModel.topQualities]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return (
    <View style={styles.wrapper}>
      <View style={[styles.gradientContainer, { width: size, height: size }]}>
        <RadialQualityGradient 
          qualities={viewModel.topQualities} 
          size={size}
          gradientStops={gradientStops}
          uniqueId={generatedUniqueId}
        />
      </View>

      {showLegend && topThreeQualities.length > 0 && (
        <View style={styles.legendContainer}>
          {topThreeQualities.map((quality, index) => (
            <View key={quality.title} style={styles.legendItem}>
              <View 
                style={[
                  styles.legendColorIndicator, 
                  { backgroundColor: quality.color || '#CCCCCC' }
                ]} 
              />
              <Text style={styles.legendTitle} numberOfLines={1} ellipsizeMode="tail">
                {quality.title}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientContainer: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  errorText: {
    ...Typography.bodyM,
    color: Colors.error,
    textAlign: 'center',
  },
  legendContainer: {
    marginTop: Spacings.s3,
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacings.s2,
  },
  legendColorIndicator: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: Spacings.s2,
  },
  legendTitle: {
    ...Typography.bodyM,
    flex: 1,
  },
});

export default RadialQualityGradientView; 
