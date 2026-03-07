/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'nyu-violet': {
          DEFAULT: '#57068C',
          dark: '#330662',
          medium: '#702B9D',
          light: '#AB82C5',
          ultra: '#EEE6F3',
        },
        'nyu-text': {
          primary: '#000000',
          secondary: '#404040',
          tertiary: '#6D6D6D',
        },
      },
      fontFamily: {
        'sans': ['Montserrat', 'Verdana', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
