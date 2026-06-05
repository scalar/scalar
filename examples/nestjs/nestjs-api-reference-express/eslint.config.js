import tsParser from '@typescript-eslint/parser'
import { defineConfig, globalIgnores } from 'eslint/config'
import prettierRecommended from 'eslint-plugin-prettier/recommended'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
    },
  },
  prettierRecommended,
])
