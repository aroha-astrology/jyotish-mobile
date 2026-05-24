import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { colors } from '@/constants/theme';

export type BadgeVariant = 'default' | 'gold' | 'accent' | 'teal' | 'red' | 'muted';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
  default: { bg: 'rgba(255,255,255,0.06)', text: colors.textSecondary, border: colors.border },
  gold:    { bg: 'rgba(212,168,67,0.12)',  text: '#d4a843',            border: 'rgba(212,168,67,0.28)' },
  accent:  { bg: 'rgba(124,58,237,0.15)',  text: '#c4b5fd',            border: 'rgba(124,58,237,0.35)' },
  teal:    { bg: 'rgba(0,212,184,0.12)',   text: '#00d4b8',            border: 'rgba(0,212,184,0.30)' },
  red:     { bg: 'rgba(239,68,68,0.12)',   text: '#f87171',            border: 'rgba(239,68,68,0.28)' },
  muted:   { bg: 'rgba(255,255,255,0.04)', text: colors.textMuted,     border: 'rgba(255,255,255,0.07)' },
};

export function Badge({ children, variant = 'default', style }: BadgeProps) {
  const v = variantStyles[variant];
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: v.bg, borderColor: v.border },
        style,
      ]}
    >
      <Text style={[styles.text, { color: v.text }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});
