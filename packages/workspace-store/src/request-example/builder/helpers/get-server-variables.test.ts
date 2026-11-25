import { describe, expect, it } from 'vitest'

import type { ServerObject } from '@/schemas/v3.2/strict/server'

import { getServerVariables } from './get-server-variables'

describe('get-server-variables', () => {
  it.each<{ name: string; server: ServerObject | null; expected: Record<string, string> }>([
    { name: 'a null server', server: null, expected: {} },
    { name: 'a server without variables', server: { url: 'https://api.example.com' }, expected: {} },
    {
      name: 'a default value',
      server: { url: '{a}', variables: { a: { default: 'v1' } } },
      expected: { a: 'v1' },
    },
    {
      name: 'an empty string default',
      server: { url: '{a}', variables: { a: { default: '' } } },
      expected: { a: '' },
    },
    {
      name: 'an empty string default with a name shared with Object.prototype',
      server: { url: '{__proto__}', variables: { ['__proto__']: { default: '' } } },
      expected: { ['__proto__']: '' },
    },
    {
      name: 'an empty string default that is part of the enum',
      server: { url: '{a}', variables: { a: { default: '', enum: ['', 'v1'] } } },
      expected: { a: '' },
    },
    {
      name: 'a default next to an empty string default',
      server: { url: '{a}{b}', variables: { a: { default: 'v1' }, b: { default: '' } } },
      expected: { a: 'v1', b: '' },
    },
    {
      name: 'a variable without a default',
      server: { url: '{a}{b}', variables: { a: { enum: ['v1'] }, b: { default: '' } } },
      expected: { b: '' },
    },
  ])('extracts $name', ({ server, expected }) => {
    expect(getServerVariables(server)).toStrictEqual(expected)
  })
})
