import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import SchemaComposition from './SchemaComposition.vue'

describe('SchemaComposition', () => {
  describe('getModelNameFromSchema', () => {
    it('displays schema title when both title and name are present', () => {
      const wrapper = mount(SchemaComposition, {
        props: {
          composition: 'oneOf',
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

      const tab = wrapper.find('.composition-selector-label')
      expect(tab.text()).toBe('One')
    })

    it('displays schema name when title is not present', () => {
      const wrapper = mount(SchemaComposition, {
        props: {
          composition: 'oneOf',
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

      const tab = wrapper.find('.composition-selector-label')
      expect(tab.text()).toBe('One')
    })

    it('displays schema title when name is not present', () => {
      const wrapper = mount(SchemaComposition, {
        props: {
          composition: 'anyOf',
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

      const tab = wrapper.find('.composition-selector-label')
      expect(tab.text()).toBe('Any')
    })

    it('displays type when neither name nor title are present', () => {
      const wrapper = mount(SchemaComposition, {
        props: {
          composition: 'oneOf',
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

      const tab = wrapper.find('.composition-selector-label')
      expect(tab.text()).toBe('object')
    })

    it('displays schema name from components when matching schema is found', () => {
      const wrapper = mount(SchemaComposition, {
        props: {
          composition: 'oneOf',
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

      const tab = wrapper.find('.composition-selector-label')
      expect(tab.text()).toBe('User')
    })

    it('humanizes array types with item type', () => {
      const wrapper = mount(SchemaComposition, {
        props: {
          composition: 'anyOf',
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

      const tab = wrapper.find('.composition-selector-label')
      expect(tab.text()).toBe('Array of string')
    })
  })

  describe('composition display', () => {
    it('humanizes composition', () => {
      const wrapper = mount(SchemaComposition, {
        props: {
          composition: 'oneOf',
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
