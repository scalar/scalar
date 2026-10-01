import { Schema as BlockSchema, SchemaProperty as BlockSchemaProperty } from '@scalar/blocks/schema'
import { type VNode, defineComponent, h } from 'vue'

import SpecificationExtension from '@/features/specification-extension/SpecificationExtension.vue'
import { scrollTargetId } from '@/helpers/lazy-bus'

/** Schema with the historical API Reference navigation and extension defaults. */
export const Schema = defineComponent({
  name: 'Schema',
  extends: BlockSchema,
  inheritAttrs: false,
  setup: (props, { attrs, slots }): (() => VNode) => {
    return () =>
      h(
        BlockSchema,
        {
          ...attrs,
          ...props,
          scrollTargetId: props.scrollTargetId ?? scrollTargetId.value,
          specificationExtension: props.specificationExtension ?? SpecificationExtension,
        },
        slots,
      )
  },
})

/** Schema property with the historical API Reference navigation and extension defaults. */
export const SchemaProperty = defineComponent({
  name: 'SchemaProperty',
  extends: BlockSchemaProperty,
  inheritAttrs: false,
  setup: (props, { attrs, slots }): (() => VNode) => {
    return () =>
      h(
        BlockSchemaProperty,
        {
          ...attrs,
          ...props,
          scrollTargetId: props.scrollTargetId ?? scrollTargetId.value,
          specificationExtension: props.specificationExtension ?? SpecificationExtension,
        },
        slots,
      )
  },
})
