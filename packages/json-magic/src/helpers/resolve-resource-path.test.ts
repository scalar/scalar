import { describe, expect, it } from 'vitest'

import { resolveResourcePath } from './resolve-resource-path'

describe('resolve-resource-path', () => {
  it.each([
    ['/tmp/source/root.json', './Pet%20Profile.json', '/tmp/source/Pet Profile.json'],
    ['/tmp/source/root.json', './Pet.json?version=1', 'file:///tmp/source/Pet.json?version=1'],
    ['/tmp/source/root.json', './Pet%2FProfile.json', 'file:///tmp/source/Pet%2FProfile.json'],
    ['/tmp/source/root.json', './bad%FF.json', 'file:///tmp/source/bad%FF.json'],
    ['C:\\source\\root.json', './Pet%20Profile.json', 'C:/source/Pet Profile.json'],
    ['file:///tmp/root.json', './child.json', 'file:///tmp/child.json'],
    ['https://source.test/root.json', './Pet%20Profile.json', 'https://source.test/Pet%20Profile.json'],
  ])('resolves %s and %s to %s', (base, reference, expected) => {
    expect(resolveResourcePath(base, reference)).toBe(expected)
  })
})
