/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          'bg-0': '#0c0e14',         // canvas neutral void (kills pure black OLED trap)
          'bg-1': '#12151e',         // surface base (sidebars, secondary app background)
          'bg-2': '#171b26',         // surface elevated (cards, panels, modals)
          'bg-3': '#1f2432',         // surface highlight (hover states, nested wells)
          'bg-4': '#282f40',         // interactive active states
          'border-subtle': 'rgba(255, 255, 255, 0.06)', // hairline dividers
          'border-default': 'rgba(255, 255, 255, 0.10)', // standard card edges
          'border-strong': 'rgba(255, 255, 255, 0.18)',  // active / focused borders
          'text-primary': '#f1f3f7', // high-contrast text (meets WCAG 2.2 4.5:1+)
          'text-secondary': '#9ca3b8',// cool neutral gray
          'text-muted': '#656e85',    // low-emphasis captions
          'text-subtle': '#454c5e',   // disabled / watermark
        },
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#93a7fc',
          400: '#6884f8',
          500: '#4f6bf5', // Institutional cobalt accent
          600: '#3b54d6',
          700: '#2c3fb5',
          800: '#202f8f',
          900: '#182269',
          950: '#0e143f',
        },
        credify: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#93a7fc',
          400: '#6884f8',
          500: '#4f6bf5',
          600: '#3b54d6',
          700: '#2c3fb5',
          800: '#202f8f',
          900: '#182269',
          950: '#0e143f',
        },
        financial: {
          success: '#10b981',
          warning: '#f59e0b',
          danger: '#f43f5e',
          info: '#38bdf8',
          settled: '#10b981',
          defaulted: '#f43f5e',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'dark-xs': '0 1px 2px rgba(0, 0, 0, 0.4)',
        'dark-sm': '0 2px 4px rgba(0, 0, 0, 0.4)',
        'dark-md': '0 4px 16px rgba(0, 0, 0, 0.5)',
        'dark-lg': '0 8px 32px rgba(0, 0, 0, 0.6)',
        'dark-inner': 'inset 0 1px 2px rgba(0, 0, 0, 0.5)',
        'depth-subtle': '0 1px 3px rgba(0, 0, 0, 0.35), 0 1px 2px rgba(0, 0, 0, 0.25)',
        'depth-card': '0 6px 20px -2px rgba(0, 0, 0, 0.45), 0 0 1px 1px rgba(255, 255, 255, 0.04)',
        'depth-elevated': '0 16px 40px -4px rgba(0, 0, 0, 0.65), 0 0 1px 1px rgba(255, 255, 255, 0.06)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.40), 0 0 1px 1px rgba(255, 255, 255, 0.08)',
        'focus-ring': '0 0 0 2px rgba(79, 107, 245, 0.35)',
      },
      transitionDuration: {
        micro: '140ms',
        fast: '140ms',
        normal: '200ms',
        state: '500ms',
        emphasis: '500ms',
        major: '900ms',
        milestone: '900ms',
      },
      transitionTimingFunction: {
        'expo-out': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      keyframes: {
        'milestone-enter': {
          '0%': { transform: 'scale(0.92)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'milestone-ring': {
          '0%': { transform: 'scale(0.8)', opacity: '0.8' },
          '100%': { transform: 'scale(1.4)', opacity: '0' },
        },
        'shimmer-slide': {
          to: {
            transform: 'translate(calc(100cqw - 100%), 0)',
          },
        },
        'spin-around': {
          '0%': {
            transform: 'translateZ(0) rotate(0)',
          },
          '100%': {
            transform: 'translateZ(0) rotate(360deg)',
          },
        },
        'shiny-text': {
          '0%, 90%, 100%': {
            'background-position': 'calc(-100% - 100px) 0',
          },
          '30%, 60%': {
            'background-position': 'calc(100% + 100px) 0',
          },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '0.35' },
          '50%': { opacity: '0.75' },
        },
      },
      animation: {
        'pulse-subtle': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'milestone-enter': 'milestone-enter 800ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'milestone-ring': 'milestone-ring 1000ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'shimmer-slide': 'shimmer-slide 3s ease-in-out infinite alternate',
        'spin-around': 'spin-around 6s infinite linear',
        'shiny-text': 'shiny-text 8s infinite',
        'pulse-slow': 'pulse-slow 4s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
