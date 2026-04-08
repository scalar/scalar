import type { ReferenceObject } from './reference'
import type { CallbacksObject } from './callbacks'
import type { ExampleObject } from './example'
import type { HeaderObject } from './header'
import type { LinkObject } from './link'
import type { ParameterObject } from './parameter'
import type { PathItemObject } from './path-item'
import type { RequestBodyObject } from './request-body'
import type { ResponseObject } from './response'
import type { SchemaObject } from './schema'
import type { SecuritySchemeObject } from './security-scheme'
/**
 * Components object
 *
 * Holds a set of reusable objects for different aspects of the OAS. All objects defined within the Components Object will have no effect on the API unless they are explicitly referenced from outside the Components Object.
 *
 * @see {@link https://spec.openapis.org/oas/v3.1#components-object}
 */
export type ComponentsObject = {
  /** An object to hold reusable [Schema Objects](https://spec.openapis.org/oas/v3.1#schema-object). */
  schemas?: Record<string, SchemaObject>
  /** An object to hold reusable [Response Objects](https://spec.openapis.org/oas/v3.1#response-object). */
  responses?: Record<string, ResponseObject | ReferenceObject>
  /** An object to hold reusable [Parameter Objects](https://spec.openapis.org/oas/v3.1#parameter-object). */
  parameters?: Record<string, ParameterObject | ReferenceObject>
  /** An object to hold reusable [Example Objects](https://spec.openapis.org/oas/v3.1#example-object). */
  examples?: Record<string, ExampleObject | ReferenceObject>
  /** An object to hold reusable [Request Body Objects](https://spec.openapis.org/oas/v3.1#request-body-object). */
  requestBodies?: Record<string, RequestBodyObject | ReferenceObject>
  /** An object to hold reusable [Header Objects](https://spec.openapis.org/oas/v3.1#header-object). */
  headers?: Record<string, HeaderObject | ReferenceObject>
  /** An object to hold reusable [Security Scheme Objects](https://spec.openapis.org/oas/v3.1#security-scheme-object). */
  securitySchemes?: Record<string, SecuritySchemeObject | ReferenceObject>
  /** An object to hold reusable [Link Objects](https://spec.openapis.org/oas/v3.1#link-object). */
  links?: Record<string, LinkObject | ReferenceObject>
  /** An object to hold reusable [Callback Objects](https://spec.openapis.org/oas/v3.1#callback-object). */
  callbacks?: Record<string, CallbacksObject | ReferenceObject>
  /** An object to hold reusable [Path Item Objects](https://spec.openapis.org/oas/v3.1#path-item-object). */
  pathItems?: Record<string, PathItemObject>
} & Record<`x-${string}`, unknown>
