<script setup lang="ts">
import { ScalarErrorBoundary } from '@scalar/components'
import type { Collection, Server } from '@scalar/oas-utils/entities/spec'
import type { OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from '@scalar/openapi-types'
import type { Spec, Tag as TagType } from '@scalar/types/legacy'
import { computed, onMounted, ref, type ComponentPublicInstance } from 'vue'

import { Lazy } from '@/components/Content/Lazy'
import { Operation } from '@/features/Operation'
import { freezeElement } from '@/helpers/freeze-element'
import { useNavState, useSidebar } from '@/hooks'

import TagAccordion from './TagAccordion.vue'
import TagSection from './TagSection.vue'

const { collection, tags, spec, layout, server } = defineProps<{
  collection: Collection
  tags: TagType[]
  spec: Spec
  layout?: 'modern' | 'classic'
  server?: Server
  schemas?:
    | OpenAPIV2.DefinitionsObject
    | Record<string, OpenAPIV3.SchemaObject>
    | Record<string, OpenAPIV3_1.SchemaObject>
    | unknown
}>()

const { getOperationId, getTagId, hash } = useNavState()
const { collapsedSidebarItems } = useSidebar()

const tagLayout = computed(() =>
  layout === 'classic' ? TagAccordion : TagSection,
)

/** If the first load is models, we do not lazy load tags/operations */
const isLazyTag = (tag: TagType) =>
  layout !== 'classic' &&
  !hash.value.startsWith('model') &&
  !collapsedSidebarItems[getTagId(tag)]

/** Grabs the index of the current operation */
const currentOperationIndex = (tag: TagType) => {
  const operationIndex = tag.operations.findIndex(
    (o) => hash.value === getOperationId(o, tag),
  )
  return Math.max(0, operationIndex)
}

/** Handles freezing the right operation */
const handleOperationRef = (
  el: Element | ComponentPublicInstance | null,
  operationIndex: number,
  tag: TagType,
) => {
  // We check for the correct operation and ensure we grab the component
  if (
    operationIndex === currentOperationIndex(tag) &&
    el &&
    el instanceof Object &&
    '$el' in el
  ) {
    // Then from the component we want the section
    const section = el.$el.nextElementSibling

    if (section) {
      console.log('we are freezing', section)
      document.body.style.overflow = 'hidden'
      const unfreeze = freezeElement(section)

      setTimeout(() => {
        // unfreeze()
      }, 300)
    }
  }
}

onMounted(() => {
  console.log('did I mounted')
})
</script>
<template>
  <Lazy
    v-for="(tag, index) in tags"
    :id="getTagId(tag)"
    :key="getTagId(tag)"
    :isLazy="isLazyTag(tag)">
    <Component
      :is="tagLayout"
      :id="getTagId(tag)"
      :collection="collection"
      :spec="spec"
      :tag="tag">
      <Lazy
        v-for="(operation, operationIndex) in tag.operations"
        :id="getOperationId(operation, tag)"
        :key="`${operation.httpVerb}-${operation.operationId}`"
        :isLazy="
          operationIndex < currentOperationIndex(tag) ||
          operationIndex > currentOperationIndex(tag) + 3
        ">
        <ScalarErrorBoundary>
          <Operation
            :ref="(el) => handleOperationRef(el, operationIndex, tag)"
            :id="getOperationId(operation, tag)"
            :collection="collection"
            :layout="layout"
            :schemas="schemas"
            :server="server"
            :transformedOperation="operation" />
        </ScalarErrorBoundary>
      </Lazy>
    </Component>
  </Lazy>
</template>
