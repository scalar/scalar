import { describe, expect, it } from 'vitest'
import { boolean } from 'zod'

import { getFileName } from '@/v2/blocks/scalar-operation-block/helpers/files'

describe('file', () => {
  describe('getFileName', () => {
    it.each([[1], [''], [boolean], [null]])('should return undefined for primitive inputs', (value) => {
      expect(getFileName(value)).toBe(undefined)
    })

    it.each([['hello.txt'], ['someFile.pdf'], ['cat.p'], ['main.js']])(
      'should return the correct name for a file object',
      (value) => {
        const file = new File([], value, { type: 'text/plain' })
        expect(getFileName(file)).toEqual(value)
      },
    )
  })
})
