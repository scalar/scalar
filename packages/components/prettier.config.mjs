import prettierConfig from '../../.prettierrc.cjs'

/** @typedef  {import("prettier").Config} PrettierConfig */
/** @typedef {import("prettier-plugin-tailwindcss").PluginOptions} TailwindConfig */
/** @type { PrettierConfig | TailwindConfig } */
export default {
  ...prettierConfig,
  plugins: [
    '@trivago/prettier-plugin-sort-imports',
    'prettier-plugin-tailwindcss',
  ],
  tailwindFunctions: ['cx', 'cva'],
  tailwindConfig: 'tailwind.config.ts',
}
