import { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: W, height: H } = Dimensions.get('window');

type Star = {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: Animated.Value;
  color: string;
};

function useTwinkleStars(count: number, sizeMin: number, sizeMax: number, colorP: number): Star[] {
  const starsRef = useRef<Star[] | null>(null);
  if (!starsRef.current) {
    starsRef.current = Array.from({ length: count }, (_, i) => {
      const isPurple = Math.random() < colorP * 0.55;
      const isGold = !isPurple && Math.random() < colorP * 0.35;
      const color = isPurple
        ? 'rgba(196,181,253,1)'
        : isGold
        ? 'rgba(226,179,64,1)'
        : 'rgba(255,255,255,1)';
      return {
        id: i,
        x: Math.random() * W,
        y: Math.random() * H,
        size: Math.random() * (sizeMax - sizeMin) + sizeMin,
        opacity: new Animated.Value(Math.random() * 0.5 + 0.15),
        color,
      };
    });
  }
  return starsRef.current;
}

function StarLayer({ stars }: { stars: Star[] }) {
  useEffect(() => {
    const anims = stars.map((s) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(s.opacity, {
            toValue: Math.random() * 0.5 + 0.5,
            duration: (Math.random() * 2000 + 1500),
            useNativeDriver: true,
          }),
          Animated.timing(s.opacity, {
            toValue: Math.random() * 0.2 + 0.1,
            duration: (Math.random() * 2000 + 1500),
            useNativeDriver: true,
          }),
        ])
      )
    );
    anims.forEach((a, i) => setTimeout(() => a.start(), Math.random() * 4000));
    return () => anims.forEach((a) => a.stop());
  }, []);

  return (
    <>
      {stars.map((s) => (
        <Animated.View
          key={s.id}
          style={[
            styles.star,
            {
              left: s.x,
              top: s.y,
              width: s.size,
              height: s.size,
              borderRadius: s.size / 2,
              backgroundColor: s.color,
              opacity: s.opacity,
            },
          ]}
        />
      ))}
    </>
  );
}

export function CosmicBackground() {
  const farStars = useTwinkleStars(100, 0.4, 1.2, 0.08);
  const midStars = useTwinkleStars(55, 0.8, 1.8, 0.20);
  const nearStars = useTwinkleStars(22, 1.6, 3.2, 0.55);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Deep space base */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#03020c' }]} />

      {/* Nebula: top-left purple */}
      <LinearGradient
        colors={['rgba(88,28,220,0.22)', 'transparent']}
        style={[styles.nebula, { top: '-5%', left: '-10%', width: '70%', height: '55%' }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      {/* Nebula: bottom-right dark */}
      <LinearGradient
        colors={['rgba(139,92,246,0.12)', 'transparent']}
        style={[styles.nebula, { bottom: '5%', right: '-10%', width: '60%', height: '45%' }]}
        start={{ x: 1, y: 1 }}
        end={{ x: 0, y: 0 }}
      />
      {/* Nebula: center gold tint */}
      <LinearGradient
        colors={['rgba(226,179,64,0.06)', 'transparent']}
        style={[styles.nebula, { bottom: '10%', left: '15%', width: '70%', height: '30%' }]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Stars */}
      <View style={StyleSheet.absoluteFill}>
        <StarLayer stars={farStars} />
        <StarLayer stars={midStars} />
        <StarLayer stars={nearStars} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  star: {
    position: 'absolute',
  },
  nebula: {
    position: 'absolute',
    borderRadius: 9999,
  },
});
