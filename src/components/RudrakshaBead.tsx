import { useEffect, useImperativeHandle, useRef, forwardRef } from 'react';
import { Animated, Easing, Pressable, View, StyleSheet } from 'react-native';
import Svg, {
  Defs,
  RadialGradient,
  LinearGradient,
  Stop,
  Circle,
  Path,
  G,
  Text as SvgText,
} from 'react-native-svg';

interface Props {
  mukhi: number;
  size: number;
  locked: boolean;
  onTap: () => void;
}

export interface RudrakshaBeadRef {
  pulse: () => void;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const RudrakshaBead = forwardRef<RudrakshaBeadRef, Props>(function RudrakshaBead(
  { mukhi, size, locked, onTap },
  ref,
) {
  const scale = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0.25)).current;
  const breathe = useRef(new Animated.Value(0)).current;

  // Continuous breathing pulse on the outer halo
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [breathe]);

  useImperativeHandle(ref, () => ({
    pulse: () => {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, { toValue: 1.12, duration: 160, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(glow,  { toValue: 0.75, duration: 160, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale, { toValue: 1.0,  duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(glow,  { toValue: 0.25, duration: 220, useNativeDriver: true }),
        ]),
      ]).start();
    },
  }));

  const breatheScale = breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.07] });
  const breatheOpacity = breathe.interpolate({ inputRange: [0, 1], outputRange: [0.18, 0.42] });

  const cx = size / 2;
  const cy = size / 2;
  const beadR = size * 0.34;
  const haloR = size * 0.46;
  const outerR = size * 0.5;

  // Generate mukhi paths: vertical arc lines that wrap the bead from top to bottom.
  // For mukhi=N we draw N evenly distributed longitudinal lines.
  const mukhiPaths: string[] = [];
  if (mukhi > 0) {
    for (let i = 0; i < mukhi; i++) {
      const angleDeg = (i / mukhi) * 180 - 90; // -90..+90
      const t = Math.sin((angleDeg * Math.PI) / 180);
      // Control point offset: smaller t = line closer to centre = more curved
      const widthAtCenter = beadR * Math.abs(t) * 0.95;
      const startX = cx + widthAtCenter * 0.0;
      const startY = cy - beadR * 0.95;
      const endX   = cx + widthAtCenter * 0.0;
      const endY   = cy + beadR * 0.95;
      const cp1X   = cx + widthAtCenter;
      const cp1Y   = cy;
      mukhiPaths.push(`M ${startX} ${startY} Q ${cp1X} ${cp1Y} ${endX} ${endY}`);
    }
  }

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Outer breathing halo */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.absoluteFill,
          {
            transform: [{ scale: breatheScale }],
            opacity: locked ? 0 : breatheOpacity,
          },
        ]}
      >
        <Svg width={size} height={size}>
          <Defs>
            <RadialGradient id="haloGrad" cx="50%" cy="50%" r="50%">
              <Stop offset="55%" stopColor="rgba(212,175,55,0)" />
              <Stop offset="80%" stopColor="rgba(242,202,80,0.55)" />
              <Stop offset="100%" stopColor="rgba(212,175,55,0)" />
            </RadialGradient>
          </Defs>
          <Circle cx={cx} cy={cy} r={outerR} fill="url(#haloGrad)" />
        </Svg>
      </Animated.View>

      {/* Tap glow ring */}
      <Animated.View pointerEvents="none" style={[styles.absoluteFill, { opacity: glow }]}>
        <Svg width={size} height={size}>
          <Circle
            cx={cx}
            cy={cy}
            r={haloR}
            stroke="rgba(242,202,80,0.65)"
            strokeWidth={1.5}
            fill="none"
          />
        </Svg>
      </Animated.View>

      {/* Bead body */}
      <Animated.View
        style={{
          transform: [{ scale }],
          opacity: locked ? 0.55 : 1,
        }}
      >
        <Pressable onPress={onTap} disabled={locked} hitSlop={20}>
          <Svg width={size} height={size}>
            <Defs>
              <RadialGradient id="beadGrad" cx="35%" cy="32%" r="70%">
                <Stop offset="0%"   stopColor="#A36A3A" />
                <Stop offset="35%"  stopColor="#6B3A2A" />
                <Stop offset="75%"  stopColor="#3D1F12" />
                <Stop offset="100%" stopColor="#1E0E07" />
              </RadialGradient>
              <LinearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%"   stopColor="rgba(242,202,80,0.0)" />
                <Stop offset="50%"  stopColor="rgba(242,202,80,0.55)" />
                <Stop offset="100%" stopColor="rgba(242,202,80,0.0)" />
              </LinearGradient>
              <RadialGradient id="rim" cx="50%" cy="50%" r="50%">
                <Stop offset="85%" stopColor="rgba(0,0,0,0)" />
                <Stop offset="100%" stopColor="rgba(0,0,0,0.55)" />
              </RadialGradient>
            </Defs>

            {/* Sphere */}
            <Circle cx={cx} cy={cy} r={beadR} fill="url(#beadGrad)" />

            {/* Brahmarandhra (top pore) */}
            <Circle cx={cx} cy={cy - beadR + 4} r={2.5} fill="#1E0E07" />

            {/* Mukhi lines */}
            {mukhiPaths.length > 0 && (
              <G opacity={0.75}>
                {mukhiPaths.map((d, i) => (
                  <Path
                    key={i}
                    d={d}
                    stroke="url(#lineGrad)"
                    strokeWidth={1.6}
                    fill="none"
                  />
                ))}
              </G>
            )}

            {/* Deity bead: draw an Om symbol on smooth surface */}
            {mukhi === 0 && (
              <SvgText
                x={cx}
                y={cy + beadR * 0.18}
                fontSize={beadR * 0.85}
                fontWeight="700"
                fill="rgba(242,202,80,0.85)"
                textAnchor="middle"
              >
                ॐ
              </SvgText>
            )}

            {/* Rim shadow for depth */}
            <Circle cx={cx} cy={cy} r={beadR} fill="url(#rim)" />

            {/* Highlight glint */}
            <Circle
              cx={cx - beadR * 0.35}
              cy={cy - beadR * 0.4}
              r={beadR * 0.18}
              fill="rgba(255,235,180,0.22)"
            />
          </Svg>
        </Pressable>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  absoluteFill: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
});
