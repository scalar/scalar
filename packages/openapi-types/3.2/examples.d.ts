import type { ExampleObject } from './example.js'
import type { ReferenceObject } from './reference.js'
export type ExamplesObject = {
  example?: unknown
  examples?: Record<string, ExampleObject | ReferenceObject>
}
