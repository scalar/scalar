import { type Component, type InjectionKey, type Ref, inject, ref } from 'vue'

/** Host integrations used by the schema tree without depending on the host application. */
export type SchemaRenderingContext = {
  /** Active deep-link target; only disclosures on its path open automatically. */
  scrollTargetId?: Ref<string>
  /** Optional renderer for the host's registered OpenAPI specification extensions. */
  specificationExtension?: Component
}

/** Provide once above the schema tree to connect navigation and extension rendering. */
export const SCHEMA_RENDERING_CONTEXT: InjectionKey<SchemaRenderingContext> = Symbol('schema-rendering-context')

/** Standalone trees have no navigation target or plugin renderer. */
export const useSchemaRenderingContext = (): SchemaRenderingContext & { scrollTargetId: Ref<string> } => {
  const context = inject(SCHEMA_RENDERING_CONTEXT, {})
  return { ...context, scrollTargetId: context.scrollTargetId ?? ref('') }
}

/** Match complete breadcrumb segments so `user` does not match `username`. */
export const isOnSchemaTargetPath = (path: string | undefined, target: string): boolean =>
  Boolean(path && target && (target === path || target.startsWith(`${path}.`)))
