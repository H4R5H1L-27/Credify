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
          'bg-0': '#ffffff',         // Pure White Canvas
          'bg-1': '#f8fafc',         // Subtle Off-White / Light Slate
          'bg-2': '#ffffff',         // Elevated White Card
          'bg-3': '#f1f5f9',         // Tertiary Surface / Hover State
          'bg-4': '#e2e8f0',         // Active / Pressed Surface
          'border-subtle': 'rgba(0, 0, 0, 0.08)',  // Clean subtle divider
          'border-default': 'rgba(0, 0, 0, 0.12)', // Standard card border
          'border-strong': 'rgba(0, 0, 0, 0.22)',  // Focused rim
          'text-primary': '#0f172a', // Deep high-contrast charcoal
          'text-secondary': '#334155',// Readable secondary dark slate
          'text-muted': '#64748b',    // Clear medium slate
          'text-subtle': '#94a3b8',   // Light slate
        },
        brand: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#ffe600', // Electric Canary Bright Yellow
          600: '#eab308', // Warm Amber Gold
          700: '#ca8a04',
          800: '#a16207',
          900: '#713f12',
          950: '#422006',
        },
        credify: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#ffe600',
          600: '#eab308',
          700: '#ca8a04',
          800: '#a16207',
          900: '#713f12',
          950: '#422006',
        },
        yellow: {
          bright: '#ffe600',
          electric: '#ffd700',
          accent: '#facc15',
        },
        financial: {
          success: '#16a34a', // Emerald Green
          warning: '#d97706', // Warm Amber
          danger: '#dc2626',  // Vivid Red
          info: '#0284c7',    // Sky Blue
          settled: '#16a34a',
          defaulted: '#dc2626',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"SF Pro Text"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', '"Plus Jakarta Sans"', 'sans-serif'],
        fancy: ['"Space Grotesk"', 'Outfit', '"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"SF Mono"', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'dark-xs': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'dark-sm': '0 1px 3px rgba(0, 0, 0, 0.08)',
        'dark-md': '0 4px 6px -1px rgba(0, 0, 0, 0.08)',
        'dark-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.08)',
        'dark-inner': 'inset 0 1px 2px rgba(0, 0, 0, 0.06)',
        'depth-subtle': '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.04)',
        'depth-card': '0 4px 16px -2px rgba(15, 23, 42, 0.06), 0 1px 2px 0 rgba(15, 23, 42, 0.04)',
        'depth-elevated': '0 12px 30px -4px rgba(15, 23, 42, 0.09), 0 4px 6px -2px rgba(15, 23, 42, 0.04)',
        'glass': '0 10px 30px 0 rgba(15, 23, 42, 0.06), inset 0 1px 0 0 rgba(255, 255, 255, 0.9)',
        'yellow-glow': '0 0 20px -2px rgba(255, 230, 0, 0.55)',
        'focus-ring': '0 0 0 3px rgba(255, 230, 0, 0.45)',
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
