export type * as OpenAPIV2 from './2.0'
export type * as OpenAPIV3 from './3.0'
export type * as OpenAPIV3_1 from './3.1'
export type * as OpenAPIV3_2 from './3.2'

export declare namespace OpenAPI {
  type Document = OpenAPIV2.Document | OpenAPIV3.Document | OpenAPIV3_1.Document | OpenAPIV3_2.Document

  type Parameter =
    | OpenAPIV2.ParameterObject
    | OpenAPIV2.ReferenceObject
    | OpenAPIV3.ParameterObject
    | OpenAPIV3.ReferenceObject
    | OpenAPIV3_1.ParameterObject
    | OpenAPIV3_1.ReferenceObject
    | OpenAPIV3_2.ParameterObject
    | OpenAPIV3_2.ReferenceObject

  type HttpMethod = 'get' | 'put' | 'post' | 'delete' | 'options' | 'head' | 'patch' | 'trace'
}
