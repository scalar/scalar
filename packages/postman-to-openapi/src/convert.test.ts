import { describe, expect, it } from 'vitest'

import { convert } from './convert'
import COLLECTION_AUTH_BASIC from './fixtures/input/v21/AuthBasic.json'
import COLLECTION_AUTH_BEARER from './fixtures/input/v21/AuthBearer.json'
import COLLECTION_AUTH_MULTIPLE from './fixtures/input/v21/AuthMultiple.json'
import COLLECTION_AUTH_REQUEST from './fixtures/input/v21/AuthRequest.json'
import COLLECTION_BASEPATH_VAR from './fixtures/input/v21/BasepathVar.json'
import EXPECTED_AUTH_BASIC from './fixtures/output/AuthBasic.json'
import EXPECTED_AUTH_BEARER from './fixtures/output/AuthBearer.json'
import EXPECTED_AUTH_MULTIPLE from './fixtures/output/AuthMultiple.json'
import EXPECTED_AUTH_REQUEST from './fixtures/output/AuthRequest.json'
import EXPECTED_BASEPATH_VAR from './fixtures/output/BasepathVar.json'
import type { PostmanCollection } from './postman'

describe('basic Auth', () => {
  it('convert collection to openapi', () => {
    expect(convert(COLLECTION_AUTH_BASIC as PostmanCollection)).toEqual(
      EXPECTED_AUTH_BASIC,
    )
  })
})

describe('bearer Auth', () => {
  it('convert collection to openapi', () => {
    expect(convert(COLLECTION_AUTH_BEARER as PostmanCollection)).toEqual(
      EXPECTED_AUTH_BEARER,
    )
  })
})

describe('multiple Auth', () => {
  it('convert collection to openapi', () => {
    expect(convert(COLLECTION_AUTH_MULTIPLE as PostmanCollection)).toEqual(
      EXPECTED_AUTH_MULTIPLE,
    )
  })
})

describe('auth request', () => {
  it('convert collection to openapi', () => {
    expect(convert(COLLECTION_AUTH_REQUEST as PostmanCollection)).toEqual(
      EXPECTED_AUTH_REQUEST,
    )
  })
})

describe('basepath var', () => {
  it('convert collection to openapi', () => {
    expect(convert(COLLECTION_BASEPATH_VAR as PostmanCollection)).toEqual(
      EXPECTED_BASEPATH_VAR,
    )
  })
})
