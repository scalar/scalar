module.exports = {
  root: true,
  env: {
    es2022: true,
  },
  parserOptions: {
    ecmaVersion: 2022,
    project: ['./tsconfig.json'],
  },
  extends: [
    'eslint:recommended',
    'plugin:vue/base',
    'plugin:vue/vue3-essential',
    'plugin:vue/vue3-strongly-recommended',
    '@vue/typescript/recommended',
    '@vue/eslint-config-typescript',
    'prettier',
    'plugin:storybook/recommended',
  ],
  plugins: ['@typescript-eslint', 'prettier'],
  ignorePatterns: [
    '**/dist/**',
    'api-reference/packages/swagger-parser/**',
    '**/dist-publish/**',
    '**/.vite-ssg-temp/**',
    '**/vite.config.ts',
    '**/vite.standalone.config.ts',
    '**/cdn/**',
  ],
  rules: {
    // ---------------------------------------------------------------------------
    // Checks
    'consistent-return': 'warn',
    'guard-for-in': 'warn',
    'no-array-constructor': 'error',
    'no-inner-declarations': ['warn'],
    'no-param-reassign': 'warn',
    'no-return-assign': 'error',
    'no-shadow': ['error'],
    'no-unused-vars': 'warn',
    'radix': ['error'],
    'no-loss-of-precision': 'error',
    'no-duplicate-imports': 'warn',
  },
  overrides: [
    {
      files: [
        '.eslintrc.js',
        '.eslintrc.mjs',
        '.eslintrc.cjs',
        'vite.config.ts',
        'syncpack.config.cjs',
      ],
      env: {
        node: true,
      },
    },
    {
      files: ['**.ts'],
      parser: '@typescript-eslint/parser',
      rules: {
        '@typescript-eslint/prefer-optional-chain': 'warn',
      },
    },
    /** Typescript language linting for vue and typescript files */
    {
      files: ['**.vue', '**.ts'],
      rules: {
        'no-array-constructor': 'off',
        '@typescript-eslint/no-array-constructor': 'error',
        'no-shadow': 'off',
        '@typescript-eslint/no-shadow': ['error'],
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': [
          'warn',
          { ignoreRestSiblings: true },
        ],
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/ban-ts-comment': 'warn',
        'no-loss-of-precision': 'off',
        '@typescript-eslint/no-loss-of-precision': 'error',
        '@typescript-eslint/consistent-type-imports': [
          'error',
          {
            prefer: 'type-imports',
            fixStyle: 'inline-type-imports',
          },
        ],
        '@typescript-eslint/consistent-type-definitions': ['warn', 'type'],
        '@typescript-eslint/consistent-type-assertions': [
          'error',
          { assertionStyle: 'as' },
        ],
        '@typescript-eslint/prefer-optional-chain': 'warn',
        'camelcase': 'off',
        '@typescript-eslint/naming-convention': [
          'error',
          // {
          //   selector: 'default',
          //   format: ['camelCase'],
          // },

          // {
          //   selector: 'variable',
          //   format: ['camelCase', 'UPPER_CASE'],
          // },
          // {
          //   selector: 'parameter',
          //   format: ['camelCase'],
          //   leadingUnderscore: 'allow',
          // },
          // {
          //   selector: 'memberLike',
          //   modifiers: ['private'],
          //   format: ['camelCase'],
          //   leadingUnderscore: 'require',
          // },
          {
            selector: 'typeLike',
            format: ['PascalCase'],
          },
        ],
      },
    },
    /** Vue SFC linting rules */
    {
      files: ['**.vue'],
      parser: 'vue-eslint-parser',
      parserOptions: {
        parser: '@typescript-eslint/parser',
      },
      rules: {
        'vue/no-undef-components': [
          'warn',
          { ignorePatterns: [/^v-\w+/, /router-link/] },
        ],
        'vue/block-lang': [
          'error',
          {
            script: { lang: 'ts' },
          },
        ],
        'vue/multi-word-component-names': 'off',
        'vue/order-in-components': 'error',
        'vue/attributes-order': [
          'error',
          {
            order: [
              'DEFINITION',
              'LIST_RENDERING',
              'CONDITIONALS',
              'RENDER_MODIFIERS',
              'GLOBAL',
              ['UNIQUE', 'SLOT'],
              'TWO_WAY_BINDING',
              'OTHER_DIRECTIVES',
              'OTHER_ATTR',
              'EVENTS',
              'CONTENT',
            ],
            alphabetical: true,
          },
        ],
        'vue/no-unused-properties': 'error',
        'vue/attribute-hyphenation': ['error', 'never'],
        'vue/no-lone-template': ['error'],
        'vue/this-in-template': ['error', 'never'],
        'vue/component-api-style': ['error', ['script-setup']],
        'vue/define-macros-order': [
          'error',
          { order: ['defineProps', 'defineEmits'] },
        ],
        'vue/define-props-declaration': ['error', 'type-based'],
        'vue/define-emits-declaration': ['error', 'type-based'],
        'vue/html-button-has-type': [
          'error',
          {
            button: true,
            submit: true,
            reset: true,
          },
        ],
        'vue/v-on-event-hyphenation': ['error', 'never'],
        'vue/require-default-prop': 0,
        'vue/component-name-in-template-casing': [
          'error',
          'PascalCase',
          {
            registeredComponentsOnly: true,
            ignores: [],
          },
        ],
        'vue/html-closing-bracket-newline': [
          'error',
          {
            singleline: 'never',
            multiline: 'never',
          },
        ],
        'vue/custom-event-name-casing': ['error', 'camelCase'],
      },
    },
    /** Other rule overrides */
    {
      files: '**.test.ts',
      rules: {
        '@typescript-eslint/ban-ts-comment': 'off',
      },
    },
    {
      files: ['**.d.ts'],
      rules: {
        'spaced-comment': 'off',
        '@typescript-eslint/triple-slash-reference': 'off',
      },
    },
  ],
}
