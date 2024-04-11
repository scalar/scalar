// @ts-check
import { createConfigForNuxt } from '@nuxt/eslint-config/flat'

// Run `npx @eslint/config-inspector` to inspect the resolved config interactively
export default createConfigForNuxt({
  features: {
    // Rules for module authors
    tooling: true,
    // Rules for formatting
    stylistic: true,
  },
  dirs: {
    src: ['./playground'],
  },
}).append(
  // Temporarily disabled some rules until we migrate our own config to flatconfig
  {
    rules: {
      '@stylistic/operator-linebreak': 0,
      'import/order': 0,
    },
  },
)
