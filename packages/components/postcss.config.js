/** Global prefix class used to scoped tailwind */
const classPrefix = 'scalar-component'

const globalRegx = /^\*|:root/

export default ({ env }) => ({
  plugins: {
    'tailwindcss/nesting': {},
    'tailwindcss': {},
    'postcss-prefix-selector': {
      prefix: `.${classPrefix}`,
      /**
       * Add the scoping prefix to all selectors and their children
       * e.g. .flex -> .scalar-component.flex, .scalar-component .flex
       */
      transform: (prefix, selector) => {
        if (env === 'development') return selector
        return `${
          selector.match(globalRegx) ? '' : selector
        }:where(${prefix}), :where(${prefix}) ${selector}`
      },
    },
    'autoprefixer': {},
  },
})

export { classPrefix as prefix }
