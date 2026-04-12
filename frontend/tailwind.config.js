/** @type {import('tailwindcss').Config} */
<<<<<<<<< Temporary merge branch 1
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
=========
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#EBF5FB',
          100: '#D6EAF8',
          200: '#AED6F1',
          300: '#85C1E9',
          400: '#5DADE2',
          500: '#2D9CDB',
          600: '#2185BE',
          700: '#1B6D9E',
          800: '#155A80',
          900: '#1B2A4A',
        },
      }
    },
  },
  corePlugins: {
    preflight: false, // Prevents conflicts with existing CSS resets
>>>>>>>>> Temporary merge branch 2
  },
  plugins: [],  
};
