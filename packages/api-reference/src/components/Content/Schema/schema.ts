import {
  Schema as BlockSchema,
  SchemaProperty as BlockSchemaProperty,
  SCHEMA_RENDERING_CONTEXT,
} from '@scalar/blocks/schema'
import { type VNode, defineComponent, h, inject, provide } from 'vue'

import SpecificationExtension from '@/features/specification-extension/SpecificationExtension.vue'
import { scrollTargetId } from '@/helpers/lazy-bus'

/** Keep public components connected to reference navigation and plugins outside ApiReference. */
const provideReferenceContext = (): void => {
  const context = inject(SCHEMA_RENDERING_CONTEXT, {})
  provide(SCHEMA_RENDERING_CONTEXT, {
    scrollTargetId,
    specificationExtension: SpecificationExtension,
    ...context,
  })
}

/** Schema with the historical API Reference navigation and extension defaults. */
export const Schema = defineComponent({
  name: 'Schema',
  extends: BlockSchema,
  inheritAttrs: false,
  setup: (props, { attrs, slots }): (() => VNode) => {
    provideReferenceContext()
    return () => h(BlockSchema, { ...attrs, ...props }, slots)
  },
})

/** Schema property with the historical API Reference navigation and extension defaults. */
export const SchemaProperty = defineComponent({
  name: 'SchemaProperty',
  extends: BlockSchemaProperty,
  inheritAttrs: false,
  setup: (props, { attrs, slots }): (() => VNode) => {
    provideReferenceContext()
    return () => h(BlockSchemaProperty, { ...attrs, ...props }, slots)
  },
})
