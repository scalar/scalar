import { lazy, union } from '@scalar/validation'

import {
  TraversedDescriptionSchemaDefinition,
  TraversedDocumentSchemaDefinition,
  TraversedExampleSchemaDefinition,
  TraversedModelsSchemaDefinition,
  TraversedOperationSchemaDefinition,
  TraversedSchemaSchemaDefinition,
  TraversedTagSchemaDefinition,
  TraversedWebhookSchemaDefinition,
} from './navigation'

/**
 * Recursive navigation entry union.
 *
 * Lives in a separate module so leaf schemas can reference it via `lazy(() => …)` without
 * circular const initializer inference in `navigation.ts`.
 */
export const TraversedEntrySchemaDefinition = union([
  lazy(() => TraversedDocumentSchemaDefinition),
  lazy(() => TraversedDescriptionSchemaDefinition),
  lazy(() => TraversedExampleSchemaDefinition),
  lazy(() => TraversedOperationSchemaDefinition),
  lazy(() => TraversedSchemaSchemaDefinition),
  lazy(() => TraversedWebhookSchemaDefinition),
  lazy(() => TraversedTagSchemaDefinition),
  lazy(() => TraversedModelsSchemaDefinition),
] as const)
