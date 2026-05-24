export const colors = {
  // Backgrounds — Vedic Night (aligned with web globals.css)
  bg: '#11131A',
  bgSurface: 'rgba(255,255,255,0.035)',
  bgSurface2: 'rgba(255,255,255,0.055)',
  bgElevated: 'rgba(255,255,255,0.08)',
  bgParchment: '#F5EFE0',
  bgCard: '#1D1F26',

  // Brand — Cosmic gold + saffron glow
  primary: '#D4AF37',
  primarySoft: '#F2CA50',
  primaryDark: '#A07820',
  primaryGlow: 'rgba(212,175,55,0.35)',

  // Accents
  accent: '#a87fff',
  accentGlow: 'rgba(168,127,255,0.28)',
  accentCyan: '#00d4b8',
  accentRose: '#ff4fa7',
  purple: '#a87fff',

  // Text
  text: '#7a6a90',
  textSecondary: '#7a6a90',
  textMuted: '#6060a0',

  // Borders
  border: 'rgba(212,168,67,0.12)',
  borderAccent: 'rgba(212,168,67,0.28)',
  borderGold: 'rgba(212,168,67,0.28)',
  borderSubtle: 'rgba(212,168,67,0.06)',
  borderGlow: 'rgba(212,168,67,0.50)',
  borderWhite: 'rgba(255,255,255,0.10)',

  // Glass depth tiers
  glass1: 'rgba(255,255,255,0.035)',
  glass2: 'rgba(255,255,255,0.055)',
  glass3: 'rgba(255,255,255,0.08)',

  // State
  destructive: '#ef4444',
  success: '#10b981',
  warning: '#FBBF24',

  // Planets
  planetSun: '#f5a623',
  planetMoon: '#b0c4de',
  planetMars: '#e53935',
  planetMercury: '#4caf50',
  planetJupiter: '#ff9800',
  planetVenus: '#ff80ab',
  planetSaturn: '#607d8b',
  planetRahu: '#9c27b0',
  planetKetu: '#795548',
} as const;

export type Colors = typeof colors;
