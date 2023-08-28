import type { ClientRequestConfig } from '../types'

/**
 * Generate a new placeholder request
 */
export const createPlaceholderRequest = (): ClientRequestConfig => ({
  name: '',
  url: '',
  type: 'GET',
  path: '',
  parameters: [],
  headers: [],
  query: [],
  body: '',
  formData: [],
})
