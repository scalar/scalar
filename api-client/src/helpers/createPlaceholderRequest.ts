import type { ClientRequestConfig } from '../types'

/**
 * Generate a new placeholder request
 */
export const createPlaceholderRequest = (): ClientRequestConfig => ({
  name: 'Create User',
  url: 'https://pokeapi.co/api/v2/item-category/{category}',
  type: 'GET',
  id: '1234',
  path: '',
  parameters: [{ name: 'category', value: '1' }],
  headers: [],
  query: [],
  body: '',
  formData: [],
})
