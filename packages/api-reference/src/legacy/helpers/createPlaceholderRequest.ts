import type { ClientRequestConfig } from '../types'

/**
 * Generate a new placeholder request
 */
export const createPlaceholderRequest = (): ClientRequestConfig => ({
  name: '',
  url: '',
  type: 'GET',
  path: '',
  variables: [],
  headers: [],
  query: [],
  body: '',
  formData: [],
})
