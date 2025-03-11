// @ts-check

import eslint from '@eslint/js'
// import prettier from 'eslint-plugin-prettier/recommended'
import vue from 'eslint-plugin-vue'
import tslint from 'typescript-eslint'
import vueParser from 'vue-eslint-parser'

export default tslint.config(
  {
    ignores: [
      '**/*.js',
      '**/*.cjs',
      '**/*.ts',
      '**/*.tsx',
      '**/*.mjs',
      '**/*.mts',
      '**/dist',
      '**/dist/**/*',
      '**/.vite-ssg-temp',
      '**/.vite-ssg-temp/**/*',
      'node_modules',
      'node_modules/**',
      '**/node_modules',
      '**/node_modules/**',
      '**/.venv',
      '**/coverage',
      '**/.turbo',
      '**/.nuxt/**',
      '**/.output/**',
    ],
  },
  eslint.configs.recommended,
  ...tslint.configs.recommended,
  ...vue.configs['flat/base'],
  ...vue.configs['flat/essential'],
  ...vue.configs['flat/strongly-recommended'],
  {
    languageOptions: {
      parser: vueParser,

      parserOptions: {
        parser: tslint.parser,
        extraFileExtensions: ['.vue'],
        // We will skip rules that require projectService as it decreased the lint speed massively
        // projectService: true,
        // tsconfigRootDir: import.meta.dirname,
      },
    },

    plugins: {
      '@typescript-eslint': tslint.plugin,
    },

    rules: {
      '@typescript-eslint/no-unused-expressions': 'warn',
      'consistent-return': 'off',
      'guard-for-in': 'warn',
      'no-undef': ['warn', {}],
      'no-inner-declarations': ['warn'],
      'no-param-reassign': 'warn',
      'no-return-assign': 'warn',
      'radix': ['warn'],
      'no-duplicate-imports': 'warn',
      'vue/no-undef-components': [
        'warn',
        {
          ignorePatterns: ['client-only', 'ssg_children', 'router-link'],
        },
      ],
      'vue/block-lang': [
        'warn',
        {
          script: {
            lang: 'ts',
          },
        },
      ],
      'vue/multi-word-component-names': 'off',
      'vue/order-in-components': 'warn',
      'vue/attributes-order': [
        'warn',
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
      'vue/no-unused-properties': 'warn',
      'vue/attribute-hyphenation': ['warn', 'never'],
      'vue/no-lone-template': ['warn'],
      'vue/this-in-template': ['warn', 'never'],
      'vue/component-api-style': ['warn', ['script-setup']],
      'vue/define-macros-order': [
        'warn',
        {
          order: ['defineProps', 'defineEmits'],
        },
      ],

      // Prettier doesn't play nice with these rules
      'vue/html-self-closing': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/html-indent': 'off',

      'vue/define-props-declaration': ['warn', 'type-based'],
      'vue/define-emits-declaration': ['warn', 'type-based'],
      'vue/html-button-has-type': [
        'warn',
        {
          button: true,
          submit: true,
          reset: true,
        },
      ],
      'vue/v-on-event-hyphenation': ['warn', 'never'],
      'vue/require-default-prop': 0,

      'vue/component-name-in-template-casing': [
        'warn',
        'PascalCase',
        {
          registeredComponentsOnly: true,
          ignores: [],
        },
      ],
      'vue/html-closing-bracket-newline': [
        'warn',
        {
          singleline: 'never',
          multiline: 'never',
        },
      ],
      'vue/custom-event-name-casing': ['warn', 'camelCase'],
      'no-array-constructor': 'off',
      '@typescript-eslint/no-array-constructor': 'warn',
      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': ['warn'],
      'no-unused-vars': 'off',

      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          ignoreRestSiblings: true,
          argsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': 'warn',
      'no-loss-of-precision': 'off',
      '@typescript-eslint/no-loss-of-precision': 'warn',

      '@typescript-eslint/consistent-type-imports': [
        'warn',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
        },
      ],
      '@typescript-eslint/consistent-type-definitions': ['warn', 'type'],
      '@typescript-eslint/consistent-type-assertions': [
        'warn',
        {
          assertionStyle: 'as',
        },
      ],
      'camelcase': 'off',

      '@typescript-eslint/naming-convention': [
        'warn',
        {
          selector: 'typeLike',
          format: ['PascalCase'],
        },
      ],
    },
  },

  // Need to disable unused vars as we always inject the complete props from the tiptap node
  {
    files: ['packages/guide/src/editor/extensions/RichTextExtensions/**'],
    rules: {
      'vue/no-unused-properties': 'off',
      'vue/prop-name-casing': 'off',
      '@typescript-eslint/consistent-type-definitions': ['off'],
    },
  },
  {
    files: ['services/helios/**'],
    languageOptions: {
      globals: {
        useFetch: 'readonly',
        useRoute: 'readonly',
        useRouter: 'readonly',
        useState: 'readonly',
        defineNuxtConfig: 'readonly',
        definePageMeta: 'readonly',
        useRuntimeConfig: 'readonly',
        $fetch: 'readonly',
        useAsyncData: 'readonly',
      },
    },
    rules: {
      'vue/no-undef-components': 'off',
    },
  },
  {
    files: ['projects/static-docs/**'],
    languageOptions: {
      globals: {
        __STATIC_DATA__: 'readonly',
      },
    },
  },
  // prettier,
)
