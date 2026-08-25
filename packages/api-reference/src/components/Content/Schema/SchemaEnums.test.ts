import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { SchemaObjectSchema } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import SchemaEnumValues from './SchemaEnums.vue'

describe('SchemaEnumValues', () => {
  describe('basic enum rendering', () => {
    it('renders enum values from value.enum', () => {
      const wrapper = mount(SchemaEnumValues, {
        props: {
          value: coerceValue(SchemaObjectSchema, {
            enum: ['red', 'green', 'blue'],
          }),
        },
      })

      expect(wrapper.text()).toContain('red')
      expect(wrapper.text()).toContain('green')
      expect(wrapper.text()).toContain('blue')
    })

    it('renders enum values from value.items.enum', () => {
      const wrapper = mount(SchemaEnumValues, {
        props: {
          value: coerceValue(SchemaObjectSchema, {
            items: {
              enum: ['small', 'medium', 'large'],
            },
          }),
        },
      })

      expect(wrapper.text()).toContain('small')
      expect(wrapper.text()).toContain('medium')
      expect(wrapper.text()).toContain('large')
    })

    it('does not render when no enum values exist', () => {
      const wrapper = mount(SchemaEnumValues, {
        props: {
          value: coerceValue(SchemaObjectSchema, {
            type: 'string',
          }),
        },
      })

      expect(wrapper.html()).toBe('<!--v-if-->')
    })

    it('does not render when enum array is empty', () => {
      const wrapper = mount(SchemaEnumValues, {
        props: {
          value: coerceValue(SchemaObjectSchema, {
            enum: [],
          }),
        },
      })

      expect(wrapper.html()).toBe('<!--v-if-->')
    })

    it('handles missing value prop gracefully', () => {
      const wrapper = mount(SchemaEnumValues, {
        // @ts-expect-error - we want to test the case where no value is provided
        props: {},
      })

      expect(wrapper.html()).toBe('<!--v-if-->')
    })
  })

  describe('x-enum-varnames formatting', () => {
    it('formats enum values with x-enum-varnames', () => {
      const wrapper = mount(SchemaEnumValues, {
        props: {
          value: coerceValue(SchemaObjectSchema, {
            enum: [100, 200, 300],
            'x-enum-varnames': ['Unauthorized', 'AccessDenied', 'Unknown'],
          }),
        },
      })

      expect(wrapper.text()).toContain('100 = Unauthorized')
      expect(wrapper.text()).toContain('200 = AccessDenied')
      expect(wrapper.text()).toContain('300 = Unknown')
    })

    it('falls back to x-enumNames when x-enum-varnames is not available', () => {
      const wrapper = mount(SchemaEnumValues, {
        props: {
          value: coerceValue(SchemaObjectSchema, {
            enum: [1, 2, 3],
            'x-enumNames': ['First', 'Second', 'Third'],
          }),
        },
      })

      expect(wrapper.text()).toContain('1 = First')
      expect(wrapper.text()).toContain('2 = Second')
      expect(wrapper.text()).toContain('3 = Third')
    })

    it('prefers x-enum-varnames over x-enumNames when both exist', () => {
      const wrapper = mount(SchemaEnumValues, {
        props: {
          value: coerceValue(SchemaObjectSchema, {
            enum: [1, 2],
            'x-enum-varnames': ['VarName1', 'VarName2'],
            'x-enumNames': ['EnumName1', 'EnumName2'],
          }),
        },
      })

      expect(wrapper.text()).toContain('1 = VarName1')
      expect(wrapper.text()).toContain('2 = VarName2')
      expect(wrapper.text()).not.toContain('EnumName1')
      expect(wrapper.text()).not.toContain('EnumName2')
    })

    it('shows plain enum values when no varnames are available', () => {
      const wrapper = mount(SchemaEnumValues, {
        props: {
          value: coerceValue(SchemaObjectSchema, {
            enum: ['active', 'inactive', 'pending'],
          }),
        },
      })

      expect(wrapper.text()).toContain('active')
      expect(wrapper.text()).toContain('inactive')
      expect(wrapper.text()).toContain('pending')
      expect(wrapper.text()).not.toContain(' = ')
    })

    it('formats enum values with x-enum-varnames from array items', () => {
      const wrapper = mount(SchemaEnumValues, {
        props: {
          value: coerceValue(SchemaObjectSchema, {
            type: 'array',
            items: {
              enum: [1, 2, 3],
              'x-enum-varnames': ['Pending', 'Approved', 'Rejected'],
            },
          }),
        },
      })

      expect(wrapper.text()).toContain('1 = Pending')
      expect(wrapper.text()).toContain('2 = Approved')
      expect(wrapper.text()).toContain('3 = Rejected')
    })

    it('handles partial varnames arrays gracefully', () => {
      const wrapper = mount(SchemaEnumValues, {
        props: {
          value: coerceValue(SchemaObjectSchema, {
            enum: [1, 2, 3, 4],
            'x-enum-varnames': ['First', 'Second'], // Only first two have varnames
          }),
        },
      })

      expect(wrapper.text()).toContain('1 = First')
      expect(wrapper.text()).toContain('2 = Second')
      expect(wrapper.text()).toContain('3')
      expect(wrapper.text()).toContain('4')
      expect(wrapper.text()).not.toContain('3 = ')
      expect(wrapper.text()).not.toContain('4 = ')
    })
  })

  describe('enum descriptions', () => {
    it('renders descriptions from x-enum-descriptions array', () => {
      const wrapper = mount(SchemaEnumValues, {
        props: {
          value: coerceValue(SchemaObjectSchema, {
            enum: [100, 200],
            'x-enum-descriptions': ['User is not authorized', 'Access denied'],
          }),
        },
      })

      expect(wrapper.text()).toContain('User is not authorized')
      expect(wrapper.text()).toContain('Access denied')
    })

    it('falls back to x-enumDescriptions array when x-enum-descriptions is not available', () => {
      const wrapper = mount(SchemaEnumValues, {
        props: {
          value: coerceValue(SchemaObjectSchema, {
            enum: [1, 2],
            'x-enumDescriptions': ['Description 1', 'Description 2'],
          }),
        },
      })

      expect(wrapper.text()).toContain('Description 1')
      expect(wrapper.text()).toContain('Description 2')
    })

    it('uses special object format for x-enumDescriptions', () => {
      const wrapper = mount(SchemaEnumValues, {
        props: {
          value: coerceValue(SchemaObjectSchema, {
            enum: ['active', 'inactive'],
            'x-enumDescriptions': {
              'active': 'The user is currently active',
              'inactive': 'The user is currently inactive',
            },
          }),
        },
      })

      // Described values render as rows, which have room for the description
      expect(wrapper.find('.property-enum-values-card').exists()).toBe(true)
      expect(wrapper.text()).toContain('active')
      expect(wrapper.text()).toContain('inactive')
    })

    it('does not show special description format when x-enumDescriptions is an array', () => {
      const wrapper = mount(SchemaEnumValues, {
        props: {
          value: coerceValue(SchemaObjectSchema, {
            enum: ['active', 'inactive'],
            'x-enumDescriptions': ['Active status', 'Inactive status'],
          }),
        },
      })

      // Array descriptions render as rows as well
      expect(wrapper.find('.property-enum-values-card').exists()).toBe(true)
    })

    it('renders descriptions from array items', () => {
      const wrapper = mount(SchemaEnumValues, {
        props: {
          value: coerceValue(SchemaObjectSchema, {
            type: 'array',
            items: {
              enum: [100, 200],
              'x-enum-descriptions': ['User is not authorized', 'Access denied'],
            },
          }),
        },
      })

      expect(wrapper.text()).toContain('User is not authorized')
      expect(wrapper.text()).toContain('Access denied')
    })

    it('handles missing description arrays gracefully', () => {
      const wrapper = mount(SchemaEnumValues, {
        props: {
          value: coerceValue(SchemaObjectSchema, {
            enum: [1, 2, 3],
          }),
        },
      })

      expect(wrapper.text()).toContain('1')
      expect(wrapper.text()).toContain('2')
      expect(wrapper.text()).toContain('3')
      // Component should still render without errors
      expect(wrapper.find('.property-enum').exists()).toBe(true)
    })
  })

  describe('long enum lists', () => {
    it('shows all values for 9 or fewer items', () => {
      const nineValues = Array.from({ length: 9 }, (_, i) => `value${i + 1}`)
      const wrapper = mount(SchemaEnumValues, {
        props: {
          value: coerceValue(SchemaObjectSchema, {
            enum: nineValues,
          }),
        },
      })

      // All 9 values should be visible
      nineValues.forEach((value) => {
        expect(wrapper.text()).toContain(value)
      })

      // No show more button should exist
      expect(wrapper.find('.enum-toggle-button').exists()).toBe(false)
    })

    it('shows only the first 8 values for more than 12 items initially', () => {
      const thirteenValues = Array.from({ length: 13 }, (_, i) => `value${i + 1}`)
      const wrapper = mount(SchemaEnumValues, {
        props: {
          value: coerceValue(SchemaObjectSchema, {
            enum: thirteenValues,
          }),
        },
      })

      // The first 8 values render as rows; the rest wait behind the reveal
      expect(wrapper.findAll('.property-enum-row').map((row) => row.text())).toEqual(thirteenValues.slice(0, 8))

      // Show more button should exist
      expect(wrapper.find('.enum-toggle-button').exists()).toBe(true)
      expect(wrapper.text()).toContain('Show all values')
    })

    it('reveals remaining values when show more is clicked', async () => {
      const fifteenValues = Array.from({ length: 15 }, (_, i) => `value${i + 1}`)
      const wrapper = mount(SchemaEnumValues, {
        props: {
          value: coerceValue(SchemaObjectSchema, {
            enum: fifteenValues,
          }),
        },
      })

      // Initially only the first 8 should be visible
      expect(wrapper.findAll('.property-enum-row')).toHaveLength(8)
      expect(wrapper.text()).toContain('value1')
      expect(wrapper.text()).toContain('value8')
      expect(wrapper.text()).not.toContain('value9')
      expect(wrapper.text()).not.toContain('value15')

      // Click show more
      await wrapper.find('.enum-toggle-button').trigger('click')

      // Now remaining values should be visible
      expect(wrapper.findAll('.property-enum-row')).toHaveLength(15)
      expect(wrapper.text()).toContain('value9')
      expect(wrapper.text()).toContain('value15')
      expect(wrapper.text()).toContain('Hide values')
    })

    it('shows exactly 12 values without a reveal', () => {
      const twelveValues = Array.from({ length: 12 }, (_, i) => `value${i + 1}`)
      const wrapper = mount(SchemaEnumValues, {
        props: {
          value: coerceValue(SchemaObjectSchema, {
            enum: twelveValues,
          }),
        },
      })

      // At the threshold every value is still on screen, as chips
      expect(wrapper.findAll('.property-enum-chip')).toHaveLength(12)
      expect(wrapper.find('.enum-toggle-button').exists()).toBe(false)
    })

    it('shows descriptions for hidden enum values when expanded', async () => {
      const wrapper = mount(SchemaEnumValues, {
        props: {
          value: coerceValue(SchemaObjectSchema, {
            enum: [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300],
            'x-enum-descriptions': [
              'First description',
              'Second description',
              'Third description',
              'Fourth description',
              'Fifth description',
              'Sixth description',
              'Seventh description',
              'Eighth description',
              'Ninth description',
              'Tenth description',
              'Eleventh description',
              'Twelfth description',
              'Thirteenth description',
            ],
          }),
        },
      })

      // Initially only the first 8 descriptions should be visible
      expect(wrapper.text()).toContain('Eighth description')
      expect(wrapper.text()).not.toContain('Ninth description')
      expect(wrapper.text()).not.toContain('Thirteenth description')

      await wrapper.find('.enum-toggle-button').trigger('click')

      // Now hidden descriptions should be visible
      expect(wrapper.text()).toContain('Ninth description')
      expect(wrapper.text()).toContain('Thirteenth description')
    })
  })

  describe('edge cases', () => {
    it('handles mixed data types in enum', () => {
      const wrapper = mount(SchemaEnumValues, {
        props: {
          value: coerceValue(SchemaObjectSchema, {
            enum: [1, 'string', true, null, 0],
          }),
        },
      })

      expect(wrapper.text()).toContain('1')
      expect(wrapper.text()).toContain('string')
      expect(wrapper.text()).toContain('true')
      expect(wrapper.text()).toContain('null')
      expect(wrapper.text()).toContain('0')
    })

    it('handles enum with duplicate values', () => {
      const wrapper = mount(SchemaEnumValues, {
        props: {
          value: coerceValue(SchemaObjectSchema, {
            enum: ['duplicate', 'duplicate', 'unique'],
          }),
        },
      })

      expect(wrapper.text()).toContain('duplicate')
      expect(wrapper.text()).toContain('unique')
    })

    it('works with both enum and varnames/descriptions', () => {
      const wrapper = mount(SchemaEnumValues, {
        props: {
          value: coerceValue(SchemaObjectSchema, {
            enum: [100, 200],
            'x-enum-varnames': ['StatusOK', 'StatusError'],
            'x-enum-descriptions': ['Request successful', 'Request failed'],
          }),
        },
      })

      expect(wrapper.text()).toContain('100 = StatusOK')
      expect(wrapper.text()).toContain('200 = StatusError')
      expect(wrapper.text()).toContain('Request successful')
      expect(wrapper.text()).toContain('Request failed')
    })

    it('drops the chip list once a short enum is long enough to need the reveal', () => {
      // Chips carry no reveal of their own, so past the threshold the rows have
      // to take over or every value renders at once (currency codes, etc.)
      const wrapper = mount(SchemaEnumValues, {
        props: {
          value: coerceValue(SchemaObjectSchema, {
            enum: Array.from({ length: 40 }, (_, index) => `c${index}`),
          }),
        },
      })

      expect(wrapper.find('.property-enum-chip-list').exists()).toBe(false)
      expect(wrapper.find('.enum-toggle-button').exists()).toBe(true)
    })

    it('still renders a short enum as chips', () => {
      const wrapper = mount(SchemaEnumValues, {
        props: {
          value: coerceValue(SchemaObjectSchema, {
            enum: ['usd', 'eur', 'gbp'],
          }),
        },
      })

      expect(wrapper.find('.property-enum-chip-list').exists()).toBe(true)
    })

    it('renders a property-names enum as the enum card', () => {
      const wrapper = mount(SchemaEnumValues, {
        props: {
          propertyNames: true,
          value: coerceValue(SchemaObjectSchema, { enum: ['alpha', 'beta'] }),
        },
      })

      expect(wrapper.find('.property-enum--tree').exists()).toBe(true)
    })

    it('handles empty string enum values', () => {
      const wrapper = mount(SchemaEnumValues, {
        props: {
          value: coerceValue(SchemaObjectSchema, {
            enum: ['', 'nonempty', ''],
          }),
        },
      })

      // Should render without errors even with empty strings
      expect(wrapper.text()).toContain('nonempty')
      expect(wrapper.find('.property-enum').exists()).toBe(true)
    })
  })
})
