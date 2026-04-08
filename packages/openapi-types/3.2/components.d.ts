import type { CallbacksObject } from './callbacks'
import type { ExampleObject } from './example'
import type { HeaderObject } from './header'
import type { LinkObject } from './link'
import type { MediaTypeObject } from './media-type'
import type { ParameterObject } from './parameter'
import type { PathItemObject } from './path-item'
import type { ReferenceObject } from './reference'
import type { RequestBodyObject } from './request-body'
import type { ResponseObject } from './response'
import type { SchemaObject } from './schema'
import type { SecuritySchemeObject } from './security-scheme'
/**
 * Components object
 *
 * Holds a set of reusable objects for different aspects of the OAS. All objects defined within the Components Object will have no effect on the API unless they are explicitly referenced from outside the Components Object.
 *
 * @see {@link https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.2.0.md#components-object}
 */
export type ComponentsObject = {
  /** An object to hold reusable [Schema Objects](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.2.0.md#schema-object). */
  schemas?: Record<string, SchemaObject>
  /** An object to hold reusable [Response Objects](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.2.0.md#response-object). */
  responses?: Record<string, ResponseObject | ReferenceObject>
  /** An object to hold reusable [Parameter Objects](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.2.0.md#parameter-object). */
  parameters?: Record<string, ParameterObject | ReferenceObject>
  /** An object to hold reusable [Example Objects](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.2.0.md#example-object). */
  examples?: Record<string, ExampleObject | ReferenceObject>
  /** An object to hold reusable [Request Body Objects](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.2.0.md#request-body-object). */
  requestBodies?: Record<string, RequestBodyObject | ReferenceObject>
  /** An object to hold reusable [Header Objects](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.2.0.md#header-object). */
  headers?: Record<string, HeaderObject | ReferenceObject>
  /** An object to hold reusable [Security Scheme Objects](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.2.0.md#security-scheme-object). */
  securitySchemes?: Record<string, SecuritySchemeObject | ReferenceObject>
  /** An object to hold reusable [Link Objects](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.2.0.md#link-object). */
  links?: Record<string, LinkObject | ReferenceObject>
  /** An object to hold reusable [Callback Objects](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.2.0.md#callback-object). */
  callbacks?: Record<string, CallbacksObject | ReferenceObject>
  /** An object to hold reusable [Path Item Objects](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.2.0.md#path-item-object). */
  pathItems?: Record<string, PathItemObject>
  /** An object to hold reusable [Media Type Objects](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.2.0.md#media-type-object). */
  mediaTypes?: Record<string, MediaTypeObject | ReferenceObject>
} & Record<`x-${string}`, unknown>
