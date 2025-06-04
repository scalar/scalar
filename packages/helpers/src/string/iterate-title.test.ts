import { describe, it, expect } from 'vitest'
import { iterateTitle } from './iterate-title'

describe('iterateTitle', () => {
  it('should return the original title if it is not a duplicate', () => {
    const checkDuplicates = (_title: string) => false
    const title = 'My Title'

    const result = iterateTitle(title, checkDuplicates)

    expect(result).toBe(title)
  })

  it('should add #2 to a duplicate title', () => {
    const checkDuplicates = (title: string) => title === 'My Title'
    const title = 'My Title'

    const result = iterateTitle(title, checkDuplicates)

    expect(result).toBe('My Title #2')
  })

  it('should increment the number for titles that already have a number', () => {
    const checkDuplicates = (title: string) => ['My Title', 'My Title #2'].includes(title)
    const title = 'My Title'

    const result = iterateTitle(title, checkDuplicates)

    expect(result).toBe('My Title #3')
  })

  it('should handle custom separators', () => {
    const checkDuplicates = (title: string) => ['My Title', 'My Title - 2'].includes(title)
    const title = 'My Title'

    const result = iterateTitle(title, checkDuplicates, ' - ')

    expect(result).toBe('My Title - 3')
  })

  it('should handle multiple iterations', () => {
    const existingTitles = ['My Title', 'My Title #2', 'My Title #3']
    const checkDuplicates = (title: string) => existingTitles.includes(title)
    const title = 'My Title'

    const result = iterateTitle(title, checkDuplicates)

    expect(result).toBe('My Title #4')
  })

  it('should handle titles with numbers in them', () => {
    const checkDuplicates = (title: string) => ['My Title 123', 'My Title 123 #2'].includes(title)
    const title = 'My Title 123'

    const result = iterateTitle(title, checkDuplicates)

    expect(result).toBe('My Title 123 #3')
  })
})
