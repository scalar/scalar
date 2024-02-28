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
      transform: (prefix, selector, prefixedSelector) => {
        if (env === 'development') return selector
        return `${prefix}${
          selector.match(globalRegx) ? '' : selector
        }, ${prefixedSelector}`
      },
    },
    'autoprefixer': {},
  },
})

export { classPrefix as prefix }
