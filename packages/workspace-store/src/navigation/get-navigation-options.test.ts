import { describe, expect, it, vi } from 'vitest'

import { type NavigationOptions, getNavigationOptions } from './get-navigation-options'

describe('get-navigation-options', () => {
  it('returns correct options structure with default values', () => {
    const options = getNavigationOptions('My API')

    expect(options).toHaveProperty('hideModels')
    expect(options).toHaveProperty('operationsSorter')
    expect(options).toHaveProperty('tagsSorter')
    expect(options).toHaveProperty('generateId')
    expect(typeof options.generateId).toBe('function')
  })

  it('sets hideModels to false when config is undefined', () => {
    const options = getNavigationOptions('My API')
    expect(options.hideModels).toBe(false)
  })

  it('sets hideModels to false when showModels is true', () => {
    const config: NavigationOptions = {
      hideModels: false,
    }
    const options = getNavigationOptions('My API', config)
    expect(options.hideModels).toBe(false)
  })

  it('sets hideModels to true when showModels is false', () => {
    const config: NavigationOptions = {
      hideModels: true,
    }
    const options = getNavigationOptions('My API', config)
    expect(options.hideModels).toBe(true)
  })

  it('uses operationsSorter from config', () => {
    const customSorter = vi.fn()
    const config: NavigationOptions = {
      operationsSorter: customSorter,
    }
    const options = getNavigationOptions('My API', config)
    expect(options.operationsSorter).toBe(customSorter)
  })

  it('uses tagsSorter from config', () => {
    const config: NavigationOptions = {
      tagsSorter: 'alpha',
    }
    const options = getNavigationOptions('My API', config)
    expect(options.tagsSorter).toBe('alpha')
  })

  it('generates document ID as slugified document name', () => {
    const options = getNavigationOptions('My Awesome API')
    const id = options.generateId({
      type: 'document',
      name: 'My Awesome API',
      info: { title: 'My Awesome API', version: '1.0.0' },
    })
    expect(id).toBe('my-awesome-api')
  })

  it('generates text ID with description prefix and slug', () => {
    const options = getNavigationOptions('Pet Store')
    const id = options.generateId({
      type: 'text',
      slug: 'introduction',
      parentId: 'pet-store',
      info: { title: 'Pet Store', version: '1.0.0' },
      depth: 1,
      value: 'Introduction',
    })
    expect(id).toBe('pet-store/description/introduction')
  })

  it('generates text ID with trailing slash when slug is empty', () => {
    const options = getNavigationOptions('Pet Store')
    const id = options.generateId({
      type: 'text',
      slug: '',
      parentId: 'pet-store',
      info: { title: 'Pet Store', version: '1.0.0' },
      depth: 1,
      value: '',
    })
    expect(id).toBe('pet-store/')
  })

  it('uses custom generateHeadingSlug when provided', () => {
    const config: NavigationOptions = {
      generateHeadingSlug: ({ slug }) => `custom-heading-${slug}`,
    }
    const options = getNavigationOptions('API', config)
    const id = options.generateId({
      type: 'text',
      slug: 'intro',
      parentId: 'api',
      info: { title: 'API', version: '1.0.0' },
      depth: 1,
      value: 'Introduction',
    })
    expect(id).toBe('custom-heading-intro')
  })

  it('generates tag ID with default slug', () => {
    const options = getNavigationOptions('Pet Store')
    const id = options.generateId({
      type: 'tag',
      parentId: 'pet-store',
      tag: { name: 'Users Management' },
    })
    expect(id).toBe('pet-store/tag/users-management')
  })

  it('uses custom generateTagSlug when provided', () => {
    const config: NavigationOptions = {
      generateTagSlug: (tag) => `custom-${tag.name?.toLowerCase()}`,
    }
    const options = getNavigationOptions('API', config)
    const id = options.generateId({
      type: 'tag',
      parentId: 'api',
      tag: { name: 'Pets' },
    })
    expect(id).toBe('api/tag/custom-pets')
  })

  it('generates operation ID without parent tag', () => {
    const options = getNavigationOptions('Pet Store')
    const id = options.generateId({
      type: 'operation',
      parentId: 'pet-store',
      path: '/pets/{id}/edit',
      method: 'get',
      operation: { summary: 'Get a pet' },
    })
    expect(id).toBe('pet-store/GET/pets/{id}/edit')
  })

  it('generates operation ID with parent tag prefix', () => {
    const options = getNavigationOptions('Pet Store')
    const id = options.generateId({
      type: 'operation',
      parentId: 'pet-store',
      path: '/pets/{id}',
      method: 'get',
      operation: { summary: 'Get a pet' },
      parentTag: {
        id: 'pet-store/tag/pets',
        tag: { name: 'Pets' },
      },
    })
    expect(id).toBe('pet-store/tag/pets/GET/pets/{id}')
  })

  it('uses custom generateOperationSlug when provided', () => {
    const config: NavigationOptions = {
      generateOperationSlug: ({ method, path }) => `${method.toUpperCase()}-${path.replace(/\//g, '-')}`,
    }
    const options = getNavigationOptions('API', config)
    const id = options.generateId({
      type: 'operation',
      parentId: 'api',
      path: '/users/create',
      method: 'post',
      operation: { operationId: 'createUser' },
    })
    expect(id).toBe('api/POST--users-create')
  })

  it('generates webhook ID without parent tag', () => {
    const options = getNavigationOptions('Pet Store')
    const id = options.generateId({
      type: 'webhook',
      parentId: 'pet-store',
      name: 'newPetCreated',
      method: 'post',
    })
    expect(id).toBe('pet-store/webhook/POST/newpetcreated')
  })

  it('generates webhook ID with parent tag prefix', () => {
    const options = getNavigationOptions('Pet Store')
    const id = options.generateId({
      type: 'webhook',
      parentId: 'pet-store',
      name: 'petUpdated',
      method: 'put',
      parentTag: {
        id: 'pet-store/tag/webhooks',
        tag: { name: 'Webhooks' },
      },
    })
    expect(id).toBe('pet-store/tag/webhooks/webhook/PUT/petupdated')
  })

  it('uses custom generateWebhookSlug when provided', () => {
    const config: NavigationOptions = {
      generateWebhookSlug: ({ name, method }) => `${method}-${name}`,
    }
    const options = getNavigationOptions('API', config)
    const id = options.generateId({
      type: 'webhook',
      parentId: 'api',
      name: 'orderCreated',
      method: 'post',
    })
    expect(id).toBe('api/webhook/POST-orderCreated')
  })

  it('generates model ID for models root when name is empty', () => {
    const options = getNavigationOptions('Pet Store')
    const id = options.generateId({
      type: 'model',
      parentId: 'pet-store',
    })
    expect(id).toBe('pet-store/models')
  })

  it('generates model ID with name', () => {
    const options = getNavigationOptions('Pet Store')
    const id = options.generateId({
      type: 'model',
      parentId: 'pet-store',
      name: 'Pet Schema',
    })
    expect(id).toBe('pet-store/model/pet-schema')
  })

  it('generates model ID with parent tag prefix', () => {
    const options = getNavigationOptions('Pet Store')
    const id = options.generateId({
      type: 'model',
      parentId: 'pet-store',
      name: 'User',
      parentTag: {
        id: 'pet-store/tag/models',
        tag: { name: 'Models' },
      },
    })
    expect(id).toBe('pet-store/tag/models/model/user')
  })

  it('uses custom generateModelSlug when provided', () => {
    const config: NavigationOptions = {
      generateModelSlug: ({ name }) => `schema-${name?.toLowerCase()}`,
    }
    const options = getNavigationOptions('API', config)
    const id = options.generateId({
      type: 'model',
      parentId: 'api',
      name: 'Order',
    })
    expect(id).toBe('api/model/schema-order')
  })

  it('generates example ID with parent prefix', () => {
    const options = getNavigationOptions('Pet Store')
    const id = options.generateId({
      type: 'example',
      parentId: 'pet-store/get/pets',
      name: 'Success Response',
    })
    expect(id).toBe('pet-store/get/pets/example/success-response')
  })

  it('handles document names with special characters', () => {
    const options = getNavigationOptions('My API (v2.0) - Production')
    const id = options.generateId({
      type: 'document',
      name: 'My API (v2.0) - Production',
      info: { title: 'My API (v2.0) - Production', version: '2.0.0' },
    })
    expect(id).toBe('my-api-v20---production')
  })

  it('handles tag with empty name', () => {
    const options = getNavigationOptions('API')
    const id = options.generateId({
      type: 'tag',
      parentId: 'api',
      tag: { name: '' },
    })
    expect(id).toBe('api/tag/')
  })

  it('handles tag with undefined name', () => {
    const options = getNavigationOptions('API')
    const id = options.generateId({
      type: 'tag',
      parentId: 'api',
      tag: {} as { name: string },
    })
    expect(id).toBe('api/tag/')
  })

  it('handles paths with query parameters in operations', () => {
    const options = getNavigationOptions('API')
    const id = options.generateId({
      type: 'operation',
      parentId: 'api',
      path: '/search?query={term}',
      method: 'get',
      operation: {},
    })
    expect(id).toBe('api/GET/search?query={term}')
  })

  it('preserves nested tag generation for operations under tags', () => {
    const options = getNavigationOptions('Store API')
    const id = options.generateId({
      type: 'operation',
      parentId: 'store-api',
      path: '/orders',
      method: 'post',
      operation: { summary: 'Create order' },
      parentTag: {
        id: 'store-api/tag/orders',
        tag: { name: 'Orders' },
      },
    })
    // The tag ID is regenerated, not used from parentTag.id
    expect(id).toBe('store-api/tag/orders/POST/orders')
  })

  it('handles webhook with undefined method', () => {
    const options = getNavigationOptions('API')
    const id = options.generateId({
      type: 'webhook',
      parentId: 'api',
      name: 'event',
      method: undefined,
    })
    expect(id).toBe('api/webhook/undefined/event')
  })

  it('returns undefined for operationsSorter when not configured', () => {
    const options = getNavigationOptions('API')
    expect(options.operationsSorter).toBeUndefined()
  })

  it('returns undefined for tagsSorter when not configured', () => {
    const options = getNavigationOptions('API')
    expect(options.tagsSorter).toBeUndefined()
  })

  it('handles empty document name', () => {
    const options = getNavigationOptions('')
    const id = options.generateId({
      type: 'document',
      name: '',
      info: { title: '', version: '1.0.0' },
    })
    expect(id).toBe('')
  })

  it('handles text type without slug returning trailing slash', () => {
    const options = getNavigationOptions('API')
    const id = options.generateId({
      type: 'text',
      parentId: 'api',
      info: { title: 'API', version: '1.0.0' },
      depth: 1,
      value: 'Some heading',
    })
    expect(id).toBe('api/')
  })
})
