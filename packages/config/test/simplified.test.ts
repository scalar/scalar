import { Value } from '@sinclair/typebox/value'
import { describe, expect, it } from 'vitest'

import { SidebarItemType } from '../src/simplified'

describe('Example schema parse', () => {
  it('parses minimal input schema', () => {
    const pageInput = {
      path: 'src/page-one.md',
      type: 'page',
      name: 'My First Page!!',
    }
    const result = Value.Check(SidebarItemType, pageInput)
    expect(result).toEqual(true)
  })

  it('parses nested input', () => {
    const nestedInput = {
      path: 'src/page-two.md',
      type: 'page',
      name: 'Page title in the config!',
      children: [
        {
          name: 'First Folder',
          type: 'folder',
          children: [
            {
              url: 'https://scalar.com/',
              type: 'link',
              name: 'Nested link',
            },
          ],
        },
      ],
    }

    const result = Value.Check(SidebarItemType, nestedInput)
    expect(result).toEqual(true)
  })

  it('throws errors in nested children schemas with missing properties', () => {
    const nestedInput = {
      path: 'src/page-two.md',
      type: 'page',
      name: 'Page title',
      children: [
        {
          name: 'First Folder',
          type: 'folder',
          children: [
            {
              url: 'https://scalar.com/',
              name: 'Nested link',
              // type: 'link'  // ERROR: required value
            },
          ],
        },
      ],
    }

    const result = Value.Check(SidebarItemType, nestedInput)

    console.log([...Value.Errors(SidebarItemType, nestedInput)])

    expect(result).toEqual(false)
  })
  it('throws errors in nested children schemas with wrong properties', () => {
    const nestedInput = {
      path: 'src/page-two.md',
      type: 'page',
      name: 'Page title',
      children: [
        {
          name: 'First Folder',
          type: 'folder',
          children: [
            {
              url: 'https://scalar.com/',
              name: 'Nested link',
              type: 'link',
              path: 'some/path/', // ERROR: required value
            },
          ],
        },
      ],
    }

    const result = Value.Check(SidebarItemType, nestedInput)

    console.log([...Value.Errors(SidebarItemType, nestedInput)])

    expect(result).toEqual(false)
  })
})
