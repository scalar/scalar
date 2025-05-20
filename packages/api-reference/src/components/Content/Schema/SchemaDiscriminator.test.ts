import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import SchemaDiscriminator from './SchemaDiscriminator.vue'

describe('SchemaDiscriminator', () => {
  describe('getModelNameFromSchema', () => {
    it('displays schema title when both title and name are present', () => {
      const wrapper = mount(SchemaDiscriminator, {
        props: {
          discriminator: 'oneOf',
          value: {
            oneOf: [
              {
                name: 'OneModel',
                title: 'One',
                type: 'object',
              },
            ],
          },
          level: 0,
        },
      })

      const tab = wrapper.find('.discriminator-selector-label')
      expect(tab.text()).toBe('One')
    })

    it('displays schema name when title is not present', () => {
      const wrapper = mount(SchemaDiscriminator, {
        props: {
          discriminator: 'oneOf',
          value: {
            oneOf: [
              {
                name: 'One',
                type: 'object',
              },
            ],
          },
          level: 0,
        },
      })

      const tab = wrapper.find('.discriminator-selector-label')
      expect(tab.text()).toBe('One')
    })

    it('displays schema title when name is not present', () => {
      const wrapper = mount(SchemaDiscriminator, {
        props: {
          discriminator: 'anyOf',
          value: {
            anyOf: [
              {
                title: 'Any',
                type: 'object',
              },
            ],
          },
          level: 0,
        },
      })

      const tab = wrapper.find('.discriminator-selector-label')
      expect(tab.text()).toBe('Any')
    })

    it('displays type when neither name nor title are present', () => {
      const wrapper = mount(SchemaDiscriminator, {
        props: {
          discriminator: 'oneOf',
          value: {
            oneOf: [
              {
                type: 'object',
              },
            ],
          },
          level: 0,
        },
      })

      const tab = wrapper.find('.discriminator-selector-label')
      expect(tab.text()).toBe('object')
    })

    it('displays schema name from components when matching schema is found', () => {
      const wrapper = mount(SchemaDiscriminator, {
        props: {
          discriminator: 'oneOf',
          schemas: {
            User: {
              type: 'object',
              properties: {
                id: { type: 'string' },
              },
            },
          },
          value: {
            oneOf: [
              {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                },
              },
            ],
          },
          level: 0,
        },
      })

      const tab = wrapper.find('.discriminator-selector-label')
      expect(tab.text()).toBe('User')
    })

    it('humanizes array types with item type', () => {
      const wrapper = mount(SchemaDiscriminator, {
        props: {
          discriminator: 'anyOf',
          value: {
            anyOf: [
              {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
            ],
          },
          level: 0,
        },
      })

      const tab = wrapper.find('.discriminator-selector-label')
      expect(tab.text()).toBe('Array of string')
    })
  })

  describe('discriminator type display', () => {
    it('humanizes discriminator type', () => {
      const wrapper = mount(SchemaDiscriminator, {
        props: {
          discriminator: 'oneOf',
          value: {
            oneOf: [{ type: 'object' }],
          },
          level: 0,
        },
      })

      const typeLabel = wrapper.find('span')
      expect(typeLabel.text()).toBe('One of')
    })
  })
})
