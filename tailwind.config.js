/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'alpha-primary': '#00DC82',
        'alpha-primary-light': '#00FF95',
        'alpha-primary-dark': '#00B36B',
        'alpha-secondary': '#1F2937',
        'alpha-secondary-light': '#374151',
        'alpha-accent': '#F59E0B',
        'alpha-surface': '#0A0A0A',
        'alpha-surface-light': '#1A1A1A',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      },
    },
  },
  plugins: [],
}