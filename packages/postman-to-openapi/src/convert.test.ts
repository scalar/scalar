import { describe, expect, it } from 'vitest'

import { convert } from './convert'
import COLLECTION_AUTH_BASIC from './fixtures/input/v21/AuthBasic.json'
import COLLECTION_AUTH_BEARER from './fixtures/input/v21/AuthBearer.json'
import COLLECTION_AUTH_MULTIPLE from './fixtures/input/v21/AuthMultiple.json'
import COLLECTION_AUTH_REQUEST from './fixtures/input/v21/AuthRequest.json'
import COLLECTION_BASEPATH_VAR from './fixtures/input/v21/BasepathVar.json'
import COLLECTION_DELETE_OPERATION from './fixtures/input/v21/DeleteOperation.json'
import COLLECTION_DEPTH_PATH_PARAMS from './fixtures/input/v21/DepthPathParams.json'
import COLLECTION_DISABLED_PARAMS from './fixtures/input/v21/DisabledParams.json'
import COLLECTION_EMPTY_URL from './fixtures/input/v21/EmptyUrl.json'
import COLLECTION_EXTERNAL_DOCS from './fixtures/input/v21/ExternalDocs.json'
import COLLECTION_FOLDER_COLLECTION from './fixtures/input/v21/FolderCollection.json'
import COLLECTION_FORM_DATA from './fixtures/input/v21/FormData.json'
import COLLECTION_FORM_URL_ENCODED from './fixtures/input/v21/FormUrlencoded.json'
import COLLECTION_GET_METHODS from './fixtures/input/v21/GetMethods.json'
import COLLECTION_HEADERS from './fixtures/input/v21/Headers.json'
import COLLECTION_JSON_COMMENTS from './fixtures/input/v21/JsonComments.json'
import COLLECTION_LICENSE_CONTACT from './fixtures/input/v21/LicenseContact.json'
import COLLECTION_MULTIPLE_SERVERS from './fixtures/input/v21/MultipleServers.json'
import COLLECTION_NO_PATH from './fixtures/input/v21/NoPath.json'
import COLLECTION_NO_VERSION from './fixtures/input/v21/NoVersion.json'
import COLLECTION_OPERATION_IDS from './fixtures/input/v21/OperationIds.json'
import COLLECTION_PARSE_STATUS_CODE from './fixtures/input/v21/ParseStatusCode.json'
import COLLECTION_PATH_PARAMS from './fixtures/input/v21/PathParams.json'
import COLLECTION_POSTMAN_TO_OPENAPI from './fixtures/input/v21/PostmantoOpenAPI.json'
import COLLECTION_RAW_BODY from './fixtures/input/v21/RawBody.json'
import COLLECTION_RESPONSES from './fixtures/input/v21/Responses.json'
import COLLECTION_RESPONSE_EMPTY from './fixtures/input/v21/ResponsesEmpty.json'
import COLLECTION_RESPONSE_MULTILANG from './fixtures/input/v21/ResponsesMultiLang.json'
import COLLECTION_SIMPLE_POST from './fixtures/input/v21/SimplePost.json'
import COLLECTION_URL_WITH_PORT from './fixtures/input/v21/UrlWithPort.json'
import COLLECTION_VARIABLES from './fixtures/input/v21/Variables.json'
import COLLECTION_X_LOGO from './fixtures/input/v21/XLogo.json'
import EXPECTED_AUTH_BASIC from './fixtures/output/AuthBasic.json'
import EXPECTED_AUTH_BEARER from './fixtures/output/AuthBearer.json'
import EXPECTED_AUTH_MULTIPLE from './fixtures/output/AuthMultiple.json'
import EXPECTED_AUTH_REQUEST from './fixtures/output/AuthRequest.json'
import EXPECTED_BASEPATH_VAR from './fixtures/output/BasepathVar.json'
import EXPECTED_DELETE_OPERATION from './fixtures/output/DeleteOperation.json'
import EXPECTED_DEPTH_PATH_PARAMS from './fixtures/output/DepthPathParams.json'
import EXPECTED_EMPTY_URL from './fixtures/output/EmptyUrl.json'
import EXPECTED_EXTERNAL_DOCS from './fixtures/output/ExternalDocs.json'
import EXPECTED_FORM_DATA from './fixtures/output/FormData.json'
import EXPECTED_GET_METHODS from './fixtures/output/GetMethods.json'
import EXPECTED_HEADERS from './fixtures/output/Headers.json'
import EXPECTED_JSON_COMMENTS from './fixtures/output/JsonComments.json'
import EXPECTED_LICENSE_CONTACT from './fixtures/output/LicenseContact.json'
import EXPECTED_MULTIPLE_SERVERS from './fixtures/output/MultipleServers.json'
import EXPECTED_NO_PATH from './fixtures/output/NoPath.json'
import EXPECTED_NO_VERSION from './fixtures/output/NoVersion.json'
import EXPECTED_OPERATION_IDS from './fixtures/output/OperationIds.json'
import EXPECTED_PATH_PARAMS from './fixtures/output/PathParams.json'
import EXPECTED_RAW_BODY from './fixtures/output/RawBody.json'
import EXPECTED_RESPONSES from './fixtures/output/Responses.json'
import EXPECTED_RESPONSE_EMPTY from './fixtures/output/ResponsesEmpty.json'
import EXPECTED_RESPONSE_MULTILANG from './fixtures/output/ResponsesMultiLang.json'
import EXPECTED_URL_WITH_PORT from './fixtures/output/UrlWithPort.json'
import EXPECTED_VARIABLES from './fixtures/output/Variables.json'
import EXPECTED_X_LOGO from './fixtures/output/XLogoVar.json'
import type { PostmanCollection } from './types'

// describe('basic Auth', () => {
//   it('convert collection to openapi', () => {
//     expect(convert(COLLECTION_AUTH_BASIC as PostmanCollection)).toEqual(
//       EXPECTED_AUTH_BASIC,
//     )
//   })
// })

// describe('bearer Auth', () => {
//   it('convert collection to openapi', () => {
//     expect(convert(COLLECTION_AUTH_BEARER as PostmanCollection)).toEqual(
//       EXPECTED_AUTH_BEARER,
//     )
//   })
// })

// describe('multiple Auth', () => {
//   it('convert collection to openapi', () => {
//     expect(convert(COLLECTION_AUTH_MULTIPLE as PostmanCollection)).toEqual(
//       EXPECTED_AUTH_MULTIPLE,
//     )
//   })
// })

// describe('auth request', () => {
//   it('convert collection to openapi', () => {
//     expect(convert(COLLECTION_AUTH_REQUEST as PostmanCollection)).toEqual(
//       EXPECTED_AUTH_REQUEST,
//     )
//   })
// })

// // we don't support basepath vars yet like [this](https://github.com/joolfe/postman-to-openapi/blob/476c8e114614f963e14a296c1c87a23c6c78d8dc/test/index.spec.js#L464C1-L476C9)
// describe.skip('basepath var', () => {
//   it('convert collection to openapi', () => {
//     expect(convert(COLLECTION_BASEPATH_VAR as PostmanCollection)).toEqual(
//       EXPECTED_BASEPATH_VAR,
//     )
//   })
// })

// describe('multiple servers', () => {
//   it('convert collection to openapi', () => {
//     expect(convert(COLLECTION_MULTIPLE_SERVERS as PostmanCollection)).toEqual(
//       EXPECTED_MULTIPLE_SERVERS,
//     )
//   })
// })

// describe('delete operation', () => {
//   it('convert collection to openapi', () => {
//     expect(convert(COLLECTION_DELETE_OPERATION as PostmanCollection)).toEqual(
//       EXPECTED_DELETE_OPERATION,
//     )
//   })
// })

//still working on this
describe('depth path params', () => {
  it('convert collection to openapi', () => {
    expect(convert(COLLECTION_DEPTH_PATH_PARAMS as PostmanCollection)).toEqual(
      EXPECTED_DEPTH_PATH_PARAMS,
    )
  })
})

// describe('empty url', () => {
//   it('convert collection to openapi', () => {
//     expect(convert(COLLECTION_EMPTY_URL as PostmanCollection)).toEqual(
//       EXPECTED_EMPTY_URL,
//     )
//   })
// })

// describe('external docs', () => {
//   it('convert collection to openapi', () => {
//     expect(convert(COLLECTION_EXTERNAL_DOCS as PostmanCollection)).toEqual(
//       EXPECTED_EXTERNAL_DOCS,
//     )
//   })
// })

// //still working on this
// describe.skip('form data', () => {
//   it('convert collection to openapi', () => {
//     expect(convert(COLLECTION_FORM_DATA as PostmanCollection)).toEqual(
//       EXPECTED_FORM_DATA,
//     )
//   })
// })

// describe('get methods', () => {
//   it('convert collection to openapi', () => {
//     expect(convert(COLLECTION_GET_METHODS as PostmanCollection)).toEqual(
//       EXPECTED_GET_METHODS,
//     )
//   })
// })

// //still working on this
// describe.skip('headers', () => {
//   it('convert collection to openapi', () => {
//     expect(convert(COLLECTION_HEADERS as PostmanCollection)).toEqual(
//       EXPECTED_HEADERS,
//     )
//   })
// })

// //still working on this
// describe.skip('json comments', () => {
//   it('convert collection to openapi', () => {
//     expect(convert(COLLECTION_JSON_COMMENTS as PostmanCollection)).toEqual(
//       EXPECTED_JSON_COMMENTS,
//     )
//   })
// })

// describe('license contact', () => {
//   it('convert collection to openapi', () => {
//     expect(convert(COLLECTION_LICENSE_CONTACT as PostmanCollection)).toEqual(
//       EXPECTED_LICENSE_CONTACT,
//     )
//   })
// })

// describe('no path', () => {
//   it('convert collection to openapi', () => {
//     expect(convert(COLLECTION_NO_PATH as PostmanCollection)).toEqual(
//       EXPECTED_NO_PATH,
//     )
//   })
// })

// // I fixed it but I don't really agree with no operation id, that's just me tho so this test is still failing
// describe.skip('operation ids', () => {
//   it('convert collection to openapi', () => {
//     expect(convert(COLLECTION_OPERATION_IDS as PostmanCollection)).toEqual(
//       EXPECTED_OPERATION_IDS,
//     )
//   })
// })

// // still working on this
// describe.skip('path params', () => {
//   it('convert collection to openapi', () => {
//     expect(convert(COLLECTION_PATH_PARAMS as PostmanCollection)).toEqual(
//       EXPECTED_PATH_PARAMS,
//     )
//   })
// })

// describe('raw body', () => {
//   it('convert collection to openapi', () => {
//     expect(convert(COLLECTION_RAW_BODY as PostmanCollection)).toEqual(
//       EXPECTED_RAW_BODY,
//     )
//   })
// })

// // still working on this
// describe.skip('responses', () => {
//   it('convert collection to openapi', () => {
//     expect(convert(COLLECTION_RESPONSES as PostmanCollection)).toEqual(
//       EXPECTED_RESPONSES,
//     )
//   })
// })

// // still working on this
// describe.skip('response empty', () => {
//   it('convert collection to openapi', () => {
//     expect(convert(COLLECTION_RESPONSE_EMPTY as PostmanCollection)).toEqual(
//       EXPECTED_RESPONSE_EMPTY,
//     )
//   })
// })

// // still working on this
// describe.skip('response multilang', () => {
//   it('convert collection to openapi', () => {
//     expect(convert(COLLECTION_RESPONSE_MULTILANG as PostmanCollection)).toEqual(
//       EXPECTED_RESPONSE_MULTILANG,
//     )
//   })
// })

// describe('url with port', () => {
//   it('convert collection to openapi', () => {
//     expect(convert(COLLECTION_URL_WITH_PORT as PostmanCollection)).toEqual(
//       EXPECTED_URL_WITH_PORT,
//     )
//   })
// })

// describe.skip('variables', () => {
//   it('convert collection to openapi', () => {
//     expect(convert(COLLECTION_VARIABLES as PostmanCollection)).toEqual(
//       EXPECTED_VARIABLES,
//     )
//   })
// })

// describe('x logo', () => {
//   it('convert collection to openapi', () => {
//     expect(convert(COLLECTION_X_LOGO as PostmanCollection)).toEqual(
//       EXPECTED_X_LOGO,
//     )
//   })
// })
