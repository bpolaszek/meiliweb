/** @type {import('tailwindcss').Config} */
const TailwindForms = require('@tailwindcss/forms')
const ContainerQueries = require('@tailwindcss/container-queries')
const VueSlider = require('@vueform/slider/tailwind')

module.exports = {
  plugins: [TailwindForms({ strategy: 'class' }), ContainerQueries, VueSlider],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef1f7',
          100: '#fee5f2',
          200: '#ffcbe7',
          300: '#ffa1d1',
          400: '#ff5caa',
          500: '#fa3a90',
          600: '#ea186c',
          700: '#cc0a52',
          800: '#a80c44',
          900: '#8c0f3b',
          950: '#56011f',
        },
      },
    },
  },
}
