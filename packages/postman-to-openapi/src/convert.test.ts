import { describe, expect, it } from 'vitest'

import { convert } from './convert'
import COLLECTION_NULL_HEADERS from './fixtures/input/NullHeaders.json'
import COLLECTION_AUTH_BASIC from './fixtures/input/v21/AuthBasic.json'
import COLLECTION_AUTH_BEARER from './fixtures/input/v21/AuthBearer.json'
import COLLECTION_AUTH_MULTIPLE from './fixtures/input/v21/AuthMultiple.json'
import COLLECTION_AUTH_REQUEST from './fixtures/input/v21/AuthRequest.json'
import COLLECTION_DELETE from './fixtures/input/v21/DeleteOperation.json'
import COLLECTION_DEPTH_PATH_PARAMS from './fixtures/input/v21/DepthPathParams.json'
import COLLECTION_DISABLED from './fixtures/input/v21/DisabledParams.json'
import COLLECTION_EMPTY_URL from './fixtures/input/v21/EmptyUrl.json'
import COLLECTION_EXTERNAL_DOCS from './fixtures/input/v21/ExternalDocs.json'
import COLLECTION_FORM_DATA from './fixtures/input/v21/FormData.json'
import COLLECTION_FORM_URLENCODED from './fixtures/input/v21/FormUrlencoded.json'
import COLLECTION_GET from './fixtures/input/v21/GetMethods.json'
import COLLECTION_HEADERS from './fixtures/input/v21/Headers.json'
import COLLECTION_LICENSE_CONTACT from './fixtures/input/v21/LicenseContact.json'
import COLLECTION_MULTIPLE_SERVERS from './fixtures/input/v21/MultipleServers.json'
import COLLECTION_NO_PATH from './fixtures/input/v21/NoPath.json'
import COLLECTION_NO_VERSION from './fixtures/input/v21/NoVersion.json'
import COLLECTION_OPERATION_IDS from './fixtures/input/v21/OperationIds.json'
import COLLECTION_PARSE_STATUS_CODE from './fixtures/input/v21/ParseStatusCode.json'
import COLLECTION_PATH_PARAMS from './fixtures/input/v21/PathParams.json'
//collection inputs
import COLLECTION_BASIC from './fixtures/input/v21/PostmantoOpenAPI.json'
import COLLECTION_RAW_BODY from './fixtures/input/v21/RawBody.json'
import COLLECTION_URL_WITH_PORT from './fixtures/input/v21/UrlWithPort.json'
import COLLECTION_X_LOGO_VAR from './fixtures/input/v21/XLogo.json'
import EXPECTED_AUTH_BASIC from './fixtures/output/AuthBasic.json'
import EXPECTED_AUTH_BEARER from './fixtures/output/AuthBearer.json'
import EXPECTED_AUTH_MULTIPLE from './fixtures/output/AuthMultiple.json'
import EXPECTED_AUTH_REQUEST from './fixtures/output/AuthRequest.json'
//expected outputs
import EXPECTED_BASIC from './fixtures/output/Basic.json'
import EXPECTED_DELETE from './fixtures/output/DeleteOperation.json'
import EXPECTED_DEPTH_PATH_PARAMS from './fixtures/output/DepthPathParams.json'
import EXPECTED_DISABLED_PARAMS_DEFAULT from './fixtures/output/DisabledParamsDefault.json'
import EXPECTED_EMPTY_URL from './fixtures/output/EmptyUrl.json'
import EXPECTED_EXTERNAL_DOCS from './fixtures/output/ExternalDocs.json'
import EXPECTED_FORM_DATA from './fixtures/output/FormData.json'
import EXPECTED_FORM_URLENCODED from './fixtures/output/FormUrlencoded.json'
import EXPECTED_GET_METHODS from './fixtures/output/GetMethods.json'
import EXPECTED_HEADERS from './fixtures/output/Headers.json'
import EXPECTED_LICENSE_CONTACT from './fixtures/output/LicenseContact.json'
import EXPECTED_MULTIPLE_SERVERS from './fixtures/output/MultipleServers.json'
import EXPECTED_NO_PATH from './fixtures/output/NoPath.json'
import EXPECTED_NO_VERSION from './fixtures/output/NoVersion.json'
import EXPECTED_NULL_HEADER from './fixtures/output/NullHeader.json'
import EXPECTED_OPERATIONS_IDS from './fixtures/output/OperationIds.json'
import EXPECTED_PARSE_STATUS_CODE from './fixtures/output/ParseStatus.json'
import EXPECTED_PATH_PARAMS from './fixtures/output/PathParams.json'
import EXPECTED_RAW_BODY from './fixtures/output/RawBody.json'
import EXPECTED_URL_WITH_PORT from './fixtures/output/UrlWithPort.json'
import EXPECTED_X_LOGO_VAR from './fixtures/output/XLogoVar.json'
import type { PostmanCollection } from './types'

describe('convert', () => {
  it('should work with a basic transform', () => {
    expect(convert(COLLECTION_BASIC as PostmanCollection)).toEqual(
      EXPECTED_BASIC,
    )
  })

  it('should use default version if not informed and not in postman variables', async function () {
    expect(convert(COLLECTION_NO_VERSION as PostmanCollection)).toEqual(
      EXPECTED_NO_VERSION,
    )
  })

  it('should parse GET methods with query string', async function () {
    expect(convert(COLLECTION_GET as PostmanCollection)).toEqual(
      EXPECTED_GET_METHODS,
    )
  })

  // working on this
  it.skip('should parse HEADERS parameters', async function () {
    expect(convert(COLLECTION_HEADERS as PostmanCollection)).toEqual(
      EXPECTED_HEADERS,
    )
  })

  // working on this
  it.skip('should parse path params', async function () {
    expect(convert(COLLECTION_PATH_PARAMS as PostmanCollection)).toEqual(
      EXPECTED_PATH_PARAMS,
    )
  })

  it('should parse servers from existing host in postman collection', async function () {
    expect(convert(COLLECTION_MULTIPLE_SERVERS as PostmanCollection)).toEqual(
      EXPECTED_MULTIPLE_SERVERS,
    )
  })

  it('should parse license and contact from variables', async function () {
    expect(convert(COLLECTION_LICENSE_CONTACT as PostmanCollection)).toEqual(
      EXPECTED_LICENSE_CONTACT,
    )
  })

  it('should use depth configuration for parse paths', async function () {
    expect(convert(COLLECTION_DEPTH_PATH_PARAMS as PostmanCollection)).toEqual(
      EXPECTED_DEPTH_PATH_PARAMS,
    )
  })

  // working on this (EASY)
  it.skip('should parse status codes from test', async function () {
    expect(convert(COLLECTION_PARSE_STATUS_CODE as PostmanCollection)).toEqual(
      EXPECTED_PARSE_STATUS_CODE,
    )
  })

  it('should parse operation when no path (only domain)', async function () {
    expect(convert(COLLECTION_NO_PATH as PostmanCollection)).toEqual(
      EXPECTED_NO_PATH,
    )
  })

  it('should support "DELETE" operations', async function () {
    expect(convert(COLLECTION_DELETE as PostmanCollection)).toEqual(
      EXPECTED_DELETE,
    )
  })

  it('should parse global authorization (Bearer)', async function () {
    expect(convert(COLLECTION_AUTH_BEARER as PostmanCollection)).toEqual(
      EXPECTED_AUTH_BEARER,
    )
  })

  it('should parse global authorization (Basic)', async function () {
    expect(convert(COLLECTION_AUTH_BASIC as PostmanCollection)).toEqual(
      EXPECTED_AUTH_BASIC,
    )
  })

  it('should parse url with port', async function () {
    expect(convert(COLLECTION_URL_WITH_PORT as PostmanCollection)).toEqual(
      EXPECTED_URL_WITH_PORT,
    )
  })

  it('should parse external docs info from variables', async function () {
    expect(convert(COLLECTION_EXTERNAL_DOCS as PostmanCollection)).toEqual(
      EXPECTED_EXTERNAL_DOCS,
    )
  })

  it('should not transform empty url request', async function () {
    expect(convert(COLLECTION_EMPTY_URL as PostmanCollection)).toEqual(
      EXPECTED_EMPTY_URL,
    )
  })

  it('should use "x-logo" from variables', async function () {
    expect(convert(COLLECTION_X_LOGO_VAR as PostmanCollection)).toEqual(
      EXPECTED_X_LOGO_VAR,
    )
  })

  it('should support auth definition at request level', async function () {
    expect(convert(COLLECTION_AUTH_MULTIPLE as PostmanCollection)).toEqual(
      EXPECTED_AUTH_MULTIPLE,
    )
  })

  it('should work if auth only defined at request level', async function () {
    expect(convert(COLLECTION_AUTH_REQUEST as PostmanCollection)).toEqual(
      EXPECTED_AUTH_REQUEST,
    )
  })

  // working on this
  it.skip('should parse POST methods with form data', async function () {
    expect(convert(COLLECTION_FORM_DATA as PostmanCollection)).toEqual(
      EXPECTED_FORM_DATA,
    )
  })

  // working on this
  it.skip('should parse POST methods with www form urlencoded', async function () {
    expect(convert(COLLECTION_FORM_URLENCODED as PostmanCollection)).toEqual(
      EXPECTED_FORM_URLENCODED,
    )
  })

  it('should try to parse raw body as json but fallback to text', async function () {
    expect(convert(COLLECTION_RAW_BODY as PostmanCollection)).toEqual(
      EXPECTED_RAW_BODY,
    )
  })

  // working on this
  it.skip('should not parse `disabled` parameters', async function () {
    expect(convert(COLLECTION_DISABLED as PostmanCollection)).toEqual(
      EXPECTED_DISABLED_PARAMS_DEFAULT,
    )
  })

  // working on this
  it.skip('should not add `operationId` by default', async function () {
    expect(convert(COLLECTION_OPERATION_IDS as PostmanCollection)).toEqual(
      EXPECTED_OPERATIONS_IDS,
    )
  })

  // working on this
  it.skip('should work if header is equals to "null" in response', async function () {
    expect(convert(COLLECTION_NULL_HEADERS as PostmanCollection)).toEqual(
      EXPECTED_NULL_HEADER,
    )
  })
})
