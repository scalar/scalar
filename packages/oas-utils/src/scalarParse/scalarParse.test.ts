import { describe, expect, test } from 'vitest'

import mega from './mega.yaml'
import { parse } from './parseOld'
import { scalarParse } from './scalarParse'
import webflowcom from './webflowcom.yaml'

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

    expect(result.tags).toStrictEqual(oldresult.tags)
    expect(result.info).toStrictEqual(oldresult.info)
    expect(result.webhooks).toStrictEqual(oldresult.webhooks)
    expect(result.components).toStrictEqual(oldresult.components)
    expect(result.paths).toStrictEqual(oldresult.paths)
    expect(result).toStrictEqual(oldresult)
  })

  test('Parse openapi 3.1 spec webflow', async () => {
    const oldresult = await parse(webflowcom)
    const result = await scalarParse(webflowcom)

    // cannot print circular reference
    // console.log(JSON.stringify(oldresult, null, 2))

    expect(result.tags).toStrictEqual(oldresult.tags)
    expect(result.info).toStrictEqual(oldresult.info)
    expect(result.webhooks).toStrictEqual(oldresult.webhooks)
    expect(result.components).toStrictEqual(oldresult.components)
    expect(result.paths).toStrictEqual(oldresult.paths)
    expect(result).toStrictEqual(oldresult)
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
