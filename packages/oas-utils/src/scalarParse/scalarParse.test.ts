import { describe, expect, test } from 'vitest'

import mega from './mega.yaml'
import { parse } from './parseOld'
import { scalarParse } from './scalarParse'

describe('Translates open api spec to data object for rendering', () => {
  test('Parse openapi 3 spec', async () => {
    const specification = {
      openapi: '3.0.0',
      info: { title: 'Example' },
      paths: {},
    }
    const oldresult = await parse(specification)
    const result = await scalarParse(specification)

    expect(result).toStrictEqual(oldresult)
  })

  test('Parse openapi 3.1 spec with webhooks', async () => {
    const oldresult = await parse(mega)
    const result = await scalarParse(mega)

    expect(result).toStrictEqual(oldresult)

    // @ts-ignore
    // expect(transformed.webhooks?.myWebhook?.description?.description).toEqual(
    //   'Overriding description',
    // )
  })
  test('Parse openapi 2 spec', async () => {
    const specification = {
      openapi: '2.0.0',
      info: { title: 'Example' },
      paths: {},
    }
    const oldresult = await parse(specification)
    const result = await scalarParse(specification)

    expect(result).toStrictEqual(oldresult)
  })
})
