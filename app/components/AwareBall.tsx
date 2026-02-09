import React, { FC } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { Image, View } from 'react-native-ui-lib';

const imageStep1 = require('@assets/images/intro/aware-ball-step1.png');
const imageStep2 = require('@assets/images/intro/aware-ball-step2.png');
const imageStep3 = require('@assets/images/intro/aware-ball-step3.png');

const images = [imageStep1, imageStep2, imageStep3];

interface AwareBallProps {
  style?: object;
  step: number;
}

const containerStyleMap: Record<number, keyof typeof styles> = {
  0: 'containerOne',
  1: 'containerTwo',
  2: 'containerThree'
};

const sizeMap: Record<number, { width: number; height: number }> = {
  0: { width: 379, height: 376 },
  1: { width: 493, height: 488 },
  2: { width: 643, height: 636 },
};

export const AwareBall: FC<AwareBallProps> = ({ style, step }) => {
  const { width } = useWindowDimensions();
  const containerStyle = styles[containerStyleMap[step]];
  const left = width / 2 - sizeMap[step].width / 2;
  const top = sizeMap[step].height / 2 * -1 + 200;
  return (
    <View style={[styles.container, containerStyle, style, { left, top }]}>
      <Image
        source={images[step]}
        style={[styles.image]}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  containerOne: {
    width: 379,
    height: 376,
  },
  containerTwo: {
    width: 493,
    height: 488,
  },
  containerThree: {
    width: 643,
    height: 636,
  },
  container: {
    position: 'absolute',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

export default React.memo(AwareBall); 