/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'blue': {
          50: '#f0f7ff',
          100: '#e0efff',
          200: '#bddcff',
          300: '#84c1ff',
          400: '#48a4ff',
          500: '#1a88ff',
          600: '#0070ff',
          700: '#0058cc',
          800: '#0047a6',
          900: '#003380',
        },
      },
    },
  },
  plugins: [],
};