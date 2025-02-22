import { describe, expect, it } from 'vitest'

import { cva, cx } from './cva'

describe('cx utility', () => {
  it('should merge classnames correctly', () => {
    expect(cx('foo', 'bar')).toBe('foo bar')
    expect(cx('foo', undefined, 'bar')).toBe('foo bar')
    expect(cx('foo', null, 'bar')).toBe('foo bar')
    expect(cx('foo', false, 'bar')).toBe('foo bar')
    expect(cx('foo', true && 'bar')).toBe('foo bar')
    expect(cx('foo', false && 'bar')).toBe('foo')
  })

  it('should de-dupe classses', () => {
    expect(cx('mt-1', 'mt-2')).toBe('mt-2')
    expect(cx('bg-b-1 bg-b-1 bg-b-2 bg-b-1')).toBe('bg-b-1')
    expect(cx('text-xxs text-3xs')).toBe('text-3xs')
  })

  it('should handle conditional classes', () => {
    const isActive = true
    const isDisabled = false
    expect(cx('base', isActive && 'active', isDisabled && 'disabled')).toBe('base active')
  })

  it('should handle tailwind conflicts', () => {
    expect(cx('p-4 px-6', 'px-2')).toBe('p-4 px-2')
    expect(cx('text-blue text-xl', 'text-red')).toBe('text-xl text-red')
  })

  it('should handle arrays of classes', () => {
    expect(cx(['foo', 'bar'], 'baz')).toBe('foo bar baz')
    expect(cx(['foo', null, undefined], ['bar', false])).toBe('foo bar')
  })
})

describe('cva utility', () => {
  it('should create variant classes correctly', () => {
    const button = cva({
      base: 'px-4 py-2 rounded',
      variants: {
        intent: {
          primary: 'bg-blue text-white',
          secondary: 'bg-gray text-black',
        },
        size: {
          sm: 'text-sm',
          lg: 'text-lg',
        },
      },
      defaultVariants: {
        intent: 'primary',
        size: 'sm',
      },
    })

    expect(button()).toBe('px-4 py-2 rounded bg-blue text-white text-sm')
    expect(button({ intent: 'secondary' })).toBe('px-4 py-2 rounded bg-gray text-black text-sm')
    expect(button({ size: 'lg' })).toBe('px-4 py-2 rounded bg-blue text-white text-lg')
  })

  it('should handle compound variants', () => {
    const button = cva({
      base: 'base-style',
      variants: {
        intent: {
          primary: 'primary-style',
          secondary: 'secondary-style',
        },
        size: {
          small: 'small-style',
          large: 'large-style',
        },
      },
      compoundVariants: [
        {
          intent: 'primary',
          size: 'small',
          class: 'primary-small-style',
        },
      ],
    })

    expect(button({ intent: 'primary', size: 'small' })).toBe(
      'base-style primary-style small-style primary-small-style',
    )
  })

  it('should handle undefined variant values', () => {
    const button = cva({
      base: 'base-style',
      variants: {
        intent: {
          primary: 'primary-style',
          secondary: 'secondary-style',
        },
      },
    })

    expect(button({ intent: undefined })).toBe('base-style')
  })
})
