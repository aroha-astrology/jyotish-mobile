import { forwardRef } from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  View,
  type PressableProps,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/theme';

export type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'accent' | 'glass';
export type ButtonSize = 'xs' | 'sm' | 'default' | 'lg' | 'icon';

export interface ButtonProps extends Omit<PressableProps, 'style'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  children: React.ReactNode;
  style?: ViewStyle;
}

const sizeMap: Record<ButtonSize, { px: number; py: number; fs: number; br: number }> = {
  xs:      { px: 10, py: 4,  fs: 11, br: 6  },
  sm:      { px: 14, py: 6,  fs: 12, br: 8  },
  default: { px: 20, py: 9,  fs: 13, br: 10 },
  lg:      { px: 28, py: 13, fs: 15, br: 12 },
  icon:    { px: 0,  py: 0,  fs: 14, br: 10 },
};

const variantBg: Partial<Record<ButtonVariant, string>> = {
  secondary:   'rgba(0,0,0,0.04)',
  outline:     'transparent',
  ghost:       'transparent',
  destructive: 'rgba(239,68,68,0.15)',
  glass:       'rgba(255,255,255,0.04)',
};

const variantBorder: Partial<Record<ButtonVariant, string>> = {
  secondary:   'rgba(212,168,67,0.18)',
  outline:     `${colors.primary}80`,
  ghost:       `${colors.primary}4D`,
  destructive: 'rgba(239,68,68,0.3)',
  glass:       'rgba(212,168,67,0.14)',
};

const variantTextColor: Record<ButtonVariant, string> = {
  default:     '#0a0600',
  secondary:   colors.text,
  outline:     colors.primary,
  ghost:       colors.primary,
  destructive: '#f87171',
  accent:      '#0a0715',
  glass:       colors.text,
};

export const Button = forwardRef<View, ButtonProps>(function Button(
  { variant = 'default', size = 'default', isLoading, children, style, disabled, ...props },
  ref
) {
  const s = sizeMap[size];
  const isDisabled = disabled || isLoading;

  const containerStyle: ViewStyle = {
    borderRadius: s.br,
    overflow: 'hidden',
    ...(size === 'icon' ? { width: 40, height: 40 } : {}),
    opacity: isDisabled ? 0.5 : 1,
    ...style,
  };

  const innerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...(size === 'icon'
      ? { width: 40, height: 40 }
      : { paddingHorizontal: s.px, paddingVertical: s.py }),
    gap: 6,
    backgroundColor: variantBg[variant],
    borderWidth: variantBorder[variant] ? 1 : 0,
    borderColor: variantBorder[variant],
  };

  const textStyle: TextStyle = {
    fontSize: s.fs,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 0.3,
    color: variantTextColor[variant],
  };

  const renderContent = () =>
    isLoading ? (
      <ActivityIndicator size="small" color={variantTextColor[variant]} />
    ) : (
      <Text style={textStyle}>{children}</Text>
    );

  return (
    <MotiView
      style={containerStyle}
      animate={{ scale: 1 }}
      transition={{ type: 'timing', duration: 80 }}
    >
      <Pressable
        ref={ref}
        disabled={isDisabled}
        android_ripple={{ color: 'rgba(255,255,255,0.1)', borderless: false }}
        {...props}
      >
        {({ pressed }) =>
          variant === 'default' ? (
            <LinearGradient
              colors={['#d4a843', '#a07820']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[innerStyle, { backgroundColor: 'transparent', borderWidth: 0, opacity: pressed ? 0.88 : 1 }]}
            >
              {renderContent()}
            </LinearGradient>
          ) : variant === 'accent' ? (
            <LinearGradient
              colors={['rgba(124,58,237,0.90)', 'rgba(124,58,237,0.60)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[innerStyle, { backgroundColor: 'transparent', borderWidth: 0, opacity: pressed ? 0.88 : 1 }]}
            >
              {renderContent()}
            </LinearGradient>
          ) : (
            <View style={[innerStyle, { opacity: pressed ? 0.8 : 1 }]}>{renderContent()}</View>
          )
        }
      </Pressable>
    </MotiView>
  );
});
