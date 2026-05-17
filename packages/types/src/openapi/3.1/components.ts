import type { CallbackObject } from './callback'
import type { ExampleObject } from './example'
import type { HeaderObject } from './header'
import type { LinkObject } from './link'
import type { ParameterObject } from './parameter'
import type { PathItemObject } from './path-item'
import type { ReferenceType } from './reference'
import type { RequestBodyObject } from './request-body'
import type { ResponsesObject } from './responses'
import type { SchemaObject } from './schema'
import type { SecuritySchemeObject } from './security-scheme'

export type SecuritySchemes = Record<string, ReferenceType<SecuritySchemeObject>>

/** Holds a set of reusable objects for different aspects of the OAS. All objects defined within the Components Object will have no effect on the API unless they are explicitly referenced from outside the Components Object. */
export type ComponentsObject = {
  /** An object to hold reusable Schema Objects. */
  schemas?: Record<string, ReferenceType<SchemaObject>>
  /** An object to hold reusable Response Objects. */
  responses?: ResponsesObject
  /** An object to hold reusable Parameter Objects. */
  parameters?: Record<string, ReferenceType<ParameterObject>>
  /** An object to hold reusable Example Objects. */
  examples?: Record<string, ReferenceType<ExampleObject>>
  /** An object to hold reusable Request Body Objects. */
  requestBodies?: Record<string, ReferenceType<RequestBodyObject>>
  /** An object to hold reusable Header Objects. */
  headers?: Record<string, ReferenceType<HeaderObject>>
  /** An object to hold reusable Security Scheme Objects. */
  securitySchemes?: SecuritySchemes
  /** An object to hold reusable Link Objects. */
  links?: Record<string, ReferenceType<LinkObject>>
  /** An object to hold reusable Callback Objects. */
  callbacks?: Record<string, ReferenceType<CallbackObject>>
  /** An object to hold reusable Path Item Objects. */
  pathItems?: Record<string, PathItemObject>
}
