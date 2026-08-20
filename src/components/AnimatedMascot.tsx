import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';

interface AnimatedMascotProps {
  width?: number;
  height?: number;
}

export const AnimatedMascot: React.FC<AnimatedMascotProps> = ({
  width = 96,
  height = 105,
}) => {
  return (
    <View
      style={[
        styles.container,
        {
          width,
          height,
        },
      ]}
    >
      <Image
        source={require('../../assets/mascot.gif')}
        style={styles.image}
        contentFit="contain"
        priority="high"
        cachePolicy="memory-disk"
        autoplay={true}
        transition={0}
        recyclingKey="shepherd_mascot_gif"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
