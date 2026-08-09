/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        heading: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        brand: {
          DEFAULT: 'var(--color-brand-primary)',
          dark: 'var(--color-brand-primary-dark)',
          light: 'var(--color-brand-primary-light)',
          accent: 'var(--color-brand-accent)',
        },
        luxury: {
          champagne: '#F5E6D3',
          sand: '#E8D5C4',
          ivory: '#FAF9F6',
          charcoal: '#2C2C2C',
        }
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.4s ease-out forwards',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      }
    },
  },
  plugins: [],
}
