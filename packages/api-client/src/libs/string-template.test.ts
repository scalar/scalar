import { describe, expect, it } from 'vitest'

import {
  flattenEnvVars,
  getDotPathValue,
  replaceTemplateVariables,
} from './string-template'

describe('Gets nested values from an object', () => {
  it('Gets basic value', () => {
    const res = getDotPathValue('some.nested', {
      some: {
        nested: 'isValue',
      },
    })

    expect(res).toEqual('isValue')
  })

  it('Handles undefined', () => {
    const res = getDotPathValue('some.bad.var', {})
    expect(res).toEqual(undefined)
  })

  it('Handles top level', () => {
    const res = getDotPathValue('name', { name: 'Dave' })
    expect(res).toEqual('Dave')
  })
})

describe('Replaces template vars with context values', () => {
  const ctx = {
    name: 'Dave',
    age: 10,
    address: {
      main: '1234 Split St.',
      city: 'Peel',
      country: 'Bananaland',
    },
  }
  it('Handles double curly variable substitution', () => {
    const res = replaceTemplateVariables(
      'My name is {{name}} from {{address.city}}',
      ctx,
    )
    expect(res).toEqual('My name is Dave from Peel')
  })
  it('Handles single curly variable substitution', () => {
    const res = replaceTemplateVariables(
      'My name is {name} from { address.city }',
      ctx,
    )
    expect(res).toEqual('My name is Dave from Peel')
  })
  it('Handles colon variable substitution', () => {
    const res = replaceTemplateVariables(
      'My name is :name from :address.city',
      ctx,
    )
    expect(res).toEqual('My name is Dave from Peel')
  })
  it('Handles object conversion to string', () => {
    const res = replaceTemplateVariables(
      'My name is {{name}} from {{address}}',
      ctx,
    )

    expect(res).toEqual(`My name is Dave from ${JSON.stringify(ctx.address)}`)
  })
})

describe('Gets dot nested paths for an environment', () => {
  it('Handles basic env', () => {
    const paths = flattenEnvVars({
      one: '1',
      two: '2',
      three: 3,
      four: {
        some: 'value',
        other: 'otherValue',
      },
    })

    expect(paths).toEqual([
      ['one', '1'],
      ['two', '2'],
      ['three', '3'],
      ['four.some', 'value'],
      ['four.other', 'otherValue'],
    ])
  })

  it('Handles array values', () => {
    const paths = flattenEnvVars({
      one: ['bear', 'cat', 'bird'],
      two: '2',
    })

    expect(paths).toEqual([
      ['one.0', 'bear'],
      ['one.1', 'cat'],
      ['one.2', 'bird'],
      ['two', '2'],
    ])
  })
})
