import type { CallbackObject } from './callback'
import type { ExampleObject } from './example'
import type { HeaderObject } from './header'
import type { LinkObject } from './link'
import type { ParameterObject } from './parameter'
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
 * @see {@link https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.4.md#components-object}
 */
export type ComponentsObject = {
  /** An object to hold reusable [Schema Objects](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.4.md#schema-object). */
  schemas?: Record<string, SchemaObject | ReferenceObject>
  /** An object to hold reusable [Response Objects](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.4.md#response-object). */
  responses?: Record<string, ReferenceObject | ResponseObject>
  /** An object to hold reusable [Parameter Objects](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.4.md#parameter-object). */
  parameters?: Record<string, ReferenceObject | ParameterObject>
  /** An object to hold reusable [Example Objects](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.4.md#example-object). */
  examples?: Record<string, ReferenceObject | ExampleObject>
  /** An object to hold reusable [Request Body Objects](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.4.md#request-body-object). */
  requestBodies?: Record<string, ReferenceObject | RequestBodyObject>
  /** An object to hold reusable [Header Objects](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.4.md#header-object). */
  headers?: Record<string, ReferenceObject | HeaderObject>
  /** An object to hold reusable [Security Scheme Objects](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.4.md#security-scheme-object). */
  securitySchemes?: Record<string, ReferenceObject | SecuritySchemeObject>
  /** An object to hold reusable [Link Objects](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.4.md#link-object). */
  links?: Record<string, ReferenceObject | LinkObject>
  /** An object to hold reusable [Callback Objects](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.4.md#callback-object). */
  callbacks?: Record<string, ReferenceObject | CallbackObject>
}
