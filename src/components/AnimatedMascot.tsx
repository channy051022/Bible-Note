import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

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
        resizeMode="contain"
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
