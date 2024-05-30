/** Global prefix class used to scoped tailwind */
export default () => ({
  plugins: {
    'tailwindcss/nesting': {},
    'tailwindcss': {},
    'autoprefixer': {},
  },
})
