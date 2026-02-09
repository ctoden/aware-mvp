import * as React from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { TypingIndicatorProps } from './types';

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ isVisible }) => {
    const [dots] = React.useState([
        new Animated.Value(0),
        new Animated.Value(0),
        new Animated.Value(0),
    ]);

    React.useEffect(() => {
        if (isVisible) {
            const animations = dots.map((dot, index) =>
                Animated.sequence([
                    Animated.delay(index * 200),
                    Animated.loop(
                        Animated.sequence([
                            Animated.timing(dot, {
                                toValue: 1,
                                duration: 400,
                                useNativeDriver: true,
                            }),
                            Animated.timing(dot, {
                                toValue: 0,
                                duration: 400,
                                useNativeDriver: true,
                            }),
                        ])
                    ),
                ])
            );

            Animated.parallel(animations).start();
        }
        return () => dots.forEach(dot => dot.setValue(0));
    }, [isVisible]);

    if (!isVisible) return null;

    return (
        <View style={styles.container}>
            {dots.map((dot, index) => (
                <Animated.View
                    key={index}
                    style={[
                        styles.dot,
                        {
                            transform: [
                                {
                                    scale: dot.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [1, 1.5],
                                    }),
                                },
                            ],
                            opacity: dot.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.5, 1],
                            }),
                        },
                    ]}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 19,
        backgroundColor: '#F0F0F0',
        width: 60,
        gap: 6,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 6,
        backgroundColor: '#212120',
    },
});