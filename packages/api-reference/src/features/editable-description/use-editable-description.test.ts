import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'

import {
  DESCRIPTION_EDITING_SYMBOL,
  EDIT_KEY_EXTENSION,
  getEditKey,
  resolveEditTarget,
  useEditableDescription,
} from './use-editable-description'

describe('use-editable-description', () => {
  describe('getEditKey', () => {
    it('reads the key off the object', () => {
      expect(getEditKey({ [EDIT_KEY_EXTENSION]: 'paths|/planets|get' })).toBe('paths|/planets|get')
    })

    it('reads the key through a $ref so a shared schema is addressed once', () => {
      const component = { [EDIT_KEY_EXTENSION]: 'components|schemas|Planet', description: 'A planet' }
      const reference = { $ref: '#/components/schemas/Planet', '$ref-value': component }

      expect(getEditKey(reference)).toBe('components|schemas|Planet')
    })

    it('ignores anything that is not a non-empty string', () => {
      expect(getEditKey({ [EDIT_KEY_EXTENSION]: '' })).toBeUndefined()
      expect(getEditKey({ [EDIT_KEY_EXTENSION]: 42 })).toBeUndefined()
      expect(getEditKey({ description: 'no key here' })).toBeUndefined()
      expect(getEditKey('not an object')).toBeUndefined()
      expect(getEditKey(undefined)).toBeUndefined()
    })
  })

  describe('resolveEditTarget', () => {
    it('returns the object itself when it is not a reference', () => {
      const target = { description: 'plain' }
      expect(resolveEditTarget(target)).toBe(target)
    })

    it('returns what the $ref points at', () => {
      const component = { description: 'shared' }
      expect(resolveEditTarget({ $ref: '#/x', '$ref-value': component })).toBe(component)
    })

    it('returns undefined for an unresolved reference', () => {
      expect(resolveEditTarget({ $ref: '#/missing' })).toBeUndefined()
    })
  })

  describe('useEditableDescription', () => {
    const mountWith = (callback: (() => void) | undefined) => {
      let result: ReturnType<typeof useEditableDescription> | undefined

      const Probe = defineComponent({
        setup() {
          result = useEditableDescription()
          return () => h('div')
        },
      })

      mount(Probe, {
        global: {
          provide: { [DESCRIPTION_EDITING_SYMBOL as symbol]: ref(callback) },
        },
      })

      if (!result) {
        throw new Error('composable did not run')
      }

      return result
    }

    it('allows editing only when both the callback and the key are present', () => {
      const withCallback = mountWith(vi.fn())
      expect(withCallback.canEdit({ [EDIT_KEY_EXTENSION]: 'info' })).toBe(true)
      expect(withCallback.canEdit({ description: 'no key' })).toBe(false)

      const withoutCallback = mountWith(undefined)
      expect(withoutCallback.canEdit({ [EDIT_KEY_EXTENSION]: 'info' })).toBe(false)
    })

    it('falls back to no callback when nothing was provided', () => {
      let result: ReturnType<typeof useEditableDescription> | undefined

      mount(
        defineComponent({
          setup() {
            result = useEditableDescription()
            return () => h('div')
          },
        }),
      )

      expect(result?.onDescriptionUpdate.value).toBeUndefined()
      expect(result?.canEdit({ [EDIT_KEY_EXTENSION]: 'info' })).toBe(false)
    })
  })
})
