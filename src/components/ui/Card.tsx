import { forwardRef } from 'react';
import {
  View,
  type ViewStyle,
  type StyleProp,
  type ViewProps,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { colors } from '@/constants/theme';

export type CardVariant = 'default' | 'glass' | 'elevated';

export interface CardProps extends Omit<ViewProps, 'style'> {
  variant?: CardVariant;
  style?: StyleProp<ViewStyle>;
}

export const Card = forwardRef<View, CardProps>(function Card(
  { variant = 'default', style, children, ...props },
  ref
) {
  const base: ViewStyle = {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  };

  if (variant === 'glass') {
    return (
      <BlurView
        intensity={14}
        tint="dark"
        style={[
          base,
          {
            backgroundColor: colors.glass1,
            borderColor: colors.borderGold,
            overflow: 'hidden',
          },
          style,
        ]}
        {...(props as any)}
      >
        {children}
      </BlurView>
    );
  }

  return (
    <View
      ref={ref}
      style={[
        base,
        {
          backgroundColor: variant === 'elevated' ? colors.bgElevated : colors.bgSurface,
          borderColor: colors.border,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
});

export function CardHeader({ style, ...props }: ViewProps) {
  return <View style={[{ paddingBottom: 10 }, style]} {...props} />;
}

export function CardContent({ style, ...props }: ViewProps) {
  return <View style={style} {...props} />;
}

export function CardFooter({ style, ...props }: ViewProps) {
  return <View style={[{ paddingTop: 10, flexDirection: 'row', alignItems: 'center' }, style]} {...props} />;
}
