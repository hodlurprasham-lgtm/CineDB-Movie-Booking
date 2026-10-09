/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { 900: '#0a0e1a', 800: '#0d1117', 700: '#12182b', 600: '#1a2035', 500: '#1e2a45' },
        cinered: { DEFAULT: '#e50914', dark: '#b8070f', light: '#ff2030' },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};
