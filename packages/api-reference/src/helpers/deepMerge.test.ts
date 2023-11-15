import { describe, expect, it } from 'vitest'

import { deepMerge } from './deepMerge'

describe('deepMerge', () => {
  it('merges objects', async () => {
    expect(
      deepMerge(
        {
          foo: 'bar',
        },
        {
          bar: 'foo',
        },
      ),
    ).toMatchObject({
      foo: 'bar',
      bar: 'foo',
    })
  })

  it('merges objects in objects', async () => {
    expect(
      deepMerge(
        {
          foo: 'bar',
          nested: {
            foo: 'bar',
          },
        },
        {
          bar: 'foo',
          nested: {
            foo: 'bar',
            bar: 'foo',
          },
        },
      ),
    ).toMatchObject({
      foo: 'bar',
      bar: 'foo',
      nested: {
        foo: 'bar',
        bar: 'foo',
      },
    })
  })

  it("doesn't merge undefined properties", async () => {
    expect(
      deepMerge(
        {
          bar: undefined,
        },
        {
          foo: 'bar',
          bar: 'foo',
        },
      ),
    ).toMatchObject({
      foo: 'bar',
      bar: 'foo',
    })
  })
})
