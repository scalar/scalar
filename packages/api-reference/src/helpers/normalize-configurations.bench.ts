import type { AnyApiReferenceConfiguration } from '@scalar/types/api-reference'
import { bench, describe } from 'vitest'

import { normalizeConfigurations, normalizeContent } from './normalize-configurations'

const minimalObjectContent = {
  openapi: '3.1.0',
  info: { title: 'Minimal API', version: '1.0.0' },
  paths: {
    '/users': {
      get: { summary: 'List Users', responses: { '200': { description: 'OK' } } },
      post: { summary: 'Create User', responses: { '201': { description: 'Created' } } },
    },
    '/users/{id}': {
      get: { summary: 'Get User', responses: { '200': { description: 'OK' } } },
      put: { summary: 'Update User', responses: { '200': { description: 'OK' } } },
      delete: { summary: 'Delete User', responses: { '204': { description: 'No Content' } } },
    },
  },
}

const jsonStringContent = JSON.stringify(minimalObjectContent)

/** A sources-style config with 20 independent API documents — typical of a developer portal. */
const multiSourceConfig = {
  sources: Array.from({ length: 20 }, (_, i) => ({
    url: `https://api.example.com/v${i}/openapi.json`,
    title: `Microservice API ${i}`,
    slug: `service-${i}`,
  })),
} as unknown as AnyApiReferenceConfiguration

describe('normalizeConfigurations', () => {
  bench('single URL config', () => {
    normalizeConfigurations({ url: 'https://api.example.com/openapi.json' })
  })

  bench('single content config (object)', () => {
    normalizeConfigurations({ content: minimalObjectContent })
  })

  bench('multi-source config (20 sources)', () => {
    normalizeConfigurations(multiSourceConfig)
  })

  bench('array of 10 URL configs', () => {
    normalizeConfigurations(
      Array.from({ length: 10 }, (_, i) => ({
        url: `https://api.example.com/service${i}/openapi.json`,
        title: `Service ${i}`,
      })) as unknown as AnyApiReferenceConfiguration,
    )
  })
})

describe('normalizeContent', () => {
  bench('JSON string (parse + return)', () => {
    normalizeContent(jsonStringContent)
  })

  bench('plain object (pass-through)', () => {
    normalizeContent(minimalObjectContent)
  })

  bench('function returning object (invoke + pass-through)', () => {
    normalizeContent(() => minimalObjectContent)
  })
})
