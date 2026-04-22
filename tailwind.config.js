/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0a',
        foreground: '#e5e7eb',
        muted: '#a1a1aa',
        border: '#262626',
        card: '#0f0f0f',
        accent: '#22c55e',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 220ms ease-out',
      },
    },
  },
  plugins: [],
}

