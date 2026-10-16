/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bakery: {
          50: '#fdf8f4',
          100: '#faeee2',
          200: '#f5dac3',
          300: '#ecc09a',
          400: '#e09e6c',
          500: '#d57f43',
          600: '#c56536',
          700: '#a44e2e',
          800: '#84402a',
          900: '#6c3625',
          950: '#3a1a11',
        }
      }
    },
  },
  plugins: [],
}
