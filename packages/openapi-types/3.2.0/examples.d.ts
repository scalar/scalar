import type { ReferenceObject } from './reference'
import type { ExampleObject } from './example'
export type ExamplesObject = {
  example?: boolean
  examples?: Record<string, ExampleObject | ReferenceObject>
}
