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
          'bg-0': '#000000',         // True OLED Pitch Black
          'bg-1': '#09090b',         // Apple secondary dark background
          'bg-2': '#121214',         // Apple elevated dark card background
          'bg-3': '#18181b',         // Apple tertiary surface / hover states
          'bg-4': '#242428',         // Apple active / pressed surface
          'border-subtle': 'rgba(255, 255, 255, 0.08)', // Apple hairline divider
          'border-default': 'rgba(255, 255, 255, 0.12)', // Apple standard card border
          'border-strong': 'rgba(255, 255, 255, 0.22)',  // Apple focused rim
          'text-primary': '#ffffff', // Crisp Apple white
          'text-secondary': '#a1a1a6',// Apple secondary label
          'text-muted': '#71717a',    // Apple tertiary label
          'text-subtle': '#52525b',   // Apple quaternary watermark
        },
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#2997ff', // Apple SF Pro Electric Blue
          600: '#0071e3', // Apple System Blue
          700: '#0058b6',
          800: '#00418c',
          900: '#002d66',
          950: '#001a40',
        },
        credify: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#2997ff',
          600: '#0071e3',
          700: '#0058b6',
          800: '#00418c',
          900: '#002d66',
          950: '#001a40',
        },
        financial: {
          success: '#30d158', // Apple System Green
          warning: '#ff9f0a', // Apple System Orange / Gold
          danger: '#ff453a',  // Apple System Red
          info: '#64d2ff',    // Apple System Cyan
          settled: '#30d158',
          defaulted: '#ff453a',
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"SF Pro Text"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"SF Mono"', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', '"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'dark-xs': '0 1px 2px rgba(0, 0, 0, 0.8)',
        'dark-sm': '0 2px 4px rgba(0, 0, 0, 0.8)',
        'dark-md': '0 4px 16px rgba(0, 0, 0, 0.85)',
        'dark-lg': '0 8px 32px rgba(0, 0, 0, 0.95)',
        'dark-inner': 'inset 0 1px 2px rgba(0, 0, 0, 0.8)',
        'depth-subtle': '0 0 0 1px rgba(255, 255, 255, 0.08), 0 2px 8px rgba(0, 0, 0, 0.8)',
        'depth-card': '0 0 0 1px rgba(255, 255, 255, 0.08), 0 8px 24px -2px rgba(0, 0, 0, 0.9), inset 0 1px 0 0 rgba(255, 255, 255, 0.08)',
        'depth-elevated': '0 0 0 1px rgba(255, 255, 255, 0.12), 0 16px 40px -4px rgba(0, 0, 0, 0.95), inset 0 1px 0 0 rgba(255, 255, 255, 0.12)',
        'glass': '0 0 0 1px rgba(255, 255, 255, 0.12), 0 16px 48px 0 rgba(0, 0, 0, 0.9), inset 0 1px 1px 0 rgba(255, 255, 255, 0.12)',
        'focus-ring': '0 0 0 3px rgba(41, 151, 255, 0.45)',
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
