/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Brand
        primary: '#d4a843',
        'primary-dark': '#a07820',
        accent: '#7C3AED',
        gold: '#F59E0B',

        // Backgrounds
        bg: '#0A0715',
        'bg-surface': '#100D20',
        'bg-elevated': '#15112B',

        // Glass
        'glass-1': 'rgba(255,255,255,0.04)',
        'glass-2': 'rgba(255,255,255,0.07)',
        'glass-3': 'rgba(255,255,255,0.10)',

        // Text
        text: '#e8e0ff',
        'text-secondary': '#9090b8',
        'text-muted': '#6060a0',

        // Borders
        border: 'rgba(255,255,255,0.09)',
        'border-gold': 'rgba(212,168,67,0.18)',

        // Semantic
        destructive: '#ef4444',
        success: '#4caf50',
        warning: '#f59e0b',

        // Planets
        sun: '#f5a623',
        moon: '#b0c4de',
        mars: '#e53935',
        mercury: '#4caf50',
        jupiter: '#ff9800',
        venus: '#ff80ab',
        saturn: '#607d8b',
        rahu: '#9c27b0',
        ketu: '#795548',
      },
      fontFamily: {
        sans: ['Poppins_400Regular'],
        'sans-medium': ['Poppins_500Medium'],
        'sans-semibold': ['Poppins_600SemiBold'],
        'sans-bold': ['Poppins_700Bold'],
        display: ['PlayfairDisplay_600SemiBold'],
        'display-bold': ['PlayfairDisplay_700Bold'],
      },
      borderRadius: {
        card: '16px',
      },
    },
  },
  plugins: [],
};
