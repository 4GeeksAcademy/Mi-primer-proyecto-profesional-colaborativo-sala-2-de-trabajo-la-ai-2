/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./*.html', './js/**/*.js'],
  theme: {
    extend: {
      colors: {
        ink: '#0D0814',
        slate: '#2C2C44',
        muted: '#646C74',
        khaki: '#BDB594',
        sand: '#EBD494',
        cream: '#FAF8F3',
        primary: '#0D0814',
        accent: '#EBD494',
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};
