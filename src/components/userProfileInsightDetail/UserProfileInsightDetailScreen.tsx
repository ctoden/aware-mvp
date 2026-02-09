import React, { FC } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { View, Text } from 'react-native-ui-lib';
import { observer } from '@legendapp/state/react';
import { useViewModel } from '@src/hooks/useViewModel';
import { UserProfileInsightDetailViewModel } from '@src/viewModels/UserProfileInsightDetailViewModel';
import { useRouter } from 'expo-router';
import BackArrow from '@src/components/icons/BackArrow';
import ShareButton from '@src/components/icons/ShareButton';
import { customColors } from '@app/constants/theme';
import { useObservable } from '@legendapp/state/react';
import { ActivityIndicator } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import Markdown from 'react-native-markdown-display';

export const UserProfileInsightDetailScreen: FC = observer(() => {
  const router = useRouter();
  const { viewModel, isInitialized, error } = useViewModel(UserProfileInsightDetailViewModel);
  
  // Reactive states from ViewModel
  const insight$ = useObservable(viewModel.insight$);
  const isLoading$ = useObservable(viewModel.isLoading$);
  const mainContent$ = useObservable(viewModel.mainContent$);
  const isContentLoading$ = useObservable(viewModel.isContentLoading$);
  
  const handleBack = () => {
    router.back();
  };
  
  const handleShare = () => {
    console.log('Share button pressed');
    // Implement share functionality here
  };
  
  if (!isInitialized || isLoading$.get()) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={customColors.black1} />
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error.message}</Text>
      </View>
    );
  }
  
  const insight = insight$.get();
  if (!insight) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load insight</Text>
      </View>
    );
  }
  
  // Generate a unique ID for the gradient
  const gradientId = `insight-gradient-${insight.title.replace(/\s+/g, '-').toLowerCase()}`;
  // Extract base color from insight
  const baseColor = insight.backgroundColor;
  
  return (
    <View style={styles.container}>
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack}>
            <BackArrow />
          </TouchableOpacity>
        </View>
        
        {/* Insight Card with gradient background */}
        <View style={styles.insightCard}>
          {/* Gradient Background */}
          <View style={styles.backgroundContainer}>
            <Svg
              width="100%"
              height="100%"
              preserveAspectRatio="none"
            >
              <Defs>
                <LinearGradient
                  id={gradientId}
                  x1="50%"
                  y1="100%"
                  x2="50%"
                  y2="0%"
                >
                  <Stop offset="0%" stopColor={baseColor} stopOpacity="1" />
                  <Stop offset="50%" stopColor="#D4C7B6" stopOpacity="1" />
                  <Stop offset="100%" stopColor="#E1DCCE" stopOpacity="1" />
                </LinearGradient>
              </Defs>
              <Rect
                x="0"
                y="0"
                width="100%"
                height="100%"
                fill={`url(#${gradientId})`}
                rx="20"
                ry="20"
              />
            </Svg>
          </View>
          
          {/* Card Content */}
          <View style={styles.cardContent}>
            <View style={styles.insightCardHeader}>
              {/* Category Chip */}
              <View style={styles.categoryChip}>
                <Text style={styles.categoryText}>{insight.category}</Text>
              </View>
              
              {/* Share Button */}
              <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                <View style={styles.shareButtonContent}>
                  <ShareButton />
                  <Text style={styles.shareButtonText}>Share</Text>
                </View>
              </TouchableOpacity>
            </View>
            
            {/* Title */}
            <Text style={styles.insightTitle}>{insight.title}</Text>
          </View>
        </View>
        
        {/* Content */}
        <View style={styles.contentContainer}>
          {isContentLoading$.get() ? (
            <View style={styles.contentLoadingContainer}>
              <ActivityIndicator size="small" color={customColors.black1} />
              <Text style={styles.contentLoadingText}>Generating personalized insights...</Text>
            </View>
          ) : (
            <Markdown style={markdownStyles}>
              {mainContent$.get()}
            </Markdown>
          )}
        </View>
      </ScrollView>
    </View>
  );
});

const markdownStyles = StyleSheet.create({
  body: {
    color: customColors.black2,
    fontSize: 16,
    lineHeight: 24,
  },
  heading1: {
    fontSize: 24,
    fontWeight: '700',
    color: customColors.black1,
    marginBottom: 16,
    marginTop: 8,
  },
  heading2: {
    fontSize: 20,
    fontWeight: '700',
    color: customColors.black1,
    marginBottom: 12,
    marginTop: 8,
  },
  paragraph: {
    fontSize: 16,
    color: customColors.black2,
    lineHeight: 24,
    marginBottom: 16,
  },
  strong: {
    fontWeight: '700',
  },
  em: {
    fontStyle: 'italic',
  },
  link: {
    color: customColors.lime,
    textDecorationLine: 'underline',
  },
  blockquote: {
    borderLeftWidth: 4,
    borderLeftColor: customColors.beige2,
    paddingLeft: 12,
    marginLeft: 8,
    marginVertical: 8,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6', // Light background from theme
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: customColors.red,
    fontSize: 16,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  insightCard: {
    marginHorizontal: 24,
    marginVertical: 16,
    borderRadius: 20,
    padding: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  cardContent: {
    zIndex: 1,
  },
  insightCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryChip: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 40,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 16,
    fontWeight: '600',
    color: customColors.black1,
  },
  shareButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 40,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  shareButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shareButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: customColors.black1,
  },
  insightTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: customColors.black1,
    marginTop: 16,
    marginBottom: 8,
  },
  contentContainer: {
    padding: 24,
  },
  contentLoadingContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentLoadingText: {
    marginTop: 12,
    fontSize: 16,
    color: customColors.black2,
    textAlign: 'center',
  },
}); 