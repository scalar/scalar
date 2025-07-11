<script setup lang="ts">
import { ScalarErrorBoundary } from '@scalar/components'
import { freezeElement } from '@scalar/helpers/dom/freeze-element'
import type { Collection, Server } from '@scalar/oas-utils/entities/spec'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { Spec, Tag as TagType } from '@scalar/types/legacy'
import { computed, onMounted, ref, type ComponentPublicInstance } from 'vue'

import { Lazy } from '@/components/Content/Lazy'
import { lazyBus } from '@/components/Content/Lazy/lazyBus'
import { Operation } from '@/features/Operation'
import { useSidebar } from '@/features/sidebar'
import { useNavState } from '@/hooks/useNavState'

import TagAccordion from './TagAccordion.vue'
import TagSection from './TagSection.vue'

const { collection, tags, spec, layout, server } = defineProps<{
  /** Just to set the id for webhooks, for now */
  id?: string
  document: OpenAPIV3_1.Document
  /**
   * @deprecated Use `document` instead
   */
  collection: Collection
  tags: TagType[]
  /**
   * @deprecated Use `document` instead
   */
  spec: Spec
  layout?: 'modern' | 'classic'
  server?: Server
}>()

const { getTagId, hash } = useNavState()
const { collapsedSidebarItems } = useSidebar()

const tagLayout = computed(() =>
  layout === 'classic' ? TagAccordion : TagSection,
)

/** Set of all ID's of tags which are lazy */
const lazyTagIds = new Set<string>()

/** If the first load is models, we do not lazy load tags/operations */
const isLazyTag = (tag: TagType) => {
  if (
    layout !== 'classic' &&
    !hash.value.startsWith('model') &&
    !collapsedSidebarItems[getTagId(tag)]
  ) {
    lazyTagIds.add(getTagId(tag))
    return true
  }

  return false
}

/** Keeps track of our unfreeze function */
const unfreeze = ref<(() => void) | null>(null)

// Remove the tag id from being lazy once it loads
lazyBus.on((event) => {
  lazyTagIds.delete(event.id)

  // Unfreeze the dom
  if (lazyTagIds.size === 0) {
    setTimeout(() => {
      unfreeze.value?.()
      unfreeze.value = null
    }, 300)
  }
})

/** Grabs the index of the current operation */
const currentOperationIndex = (tag: TagType) => {
  const operationIndex = tag.operations.findIndex((o) => hash.value === o.id)
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
    hash.value &&
    operationIndex === currentOperationIndex(tag) &&
    el &&
    el instanceof Object &&
    '$el' in el
  ) {
    // Then from the component we want the section
    const section = el.$el.nextElementSibling
    if (section) {
      unfreeze.value = freezeElement(section)
    }
  }
}
</script>
<template>
  <Lazy
    v-for="(tag, index) in tags"
    :id="id || getTagId(tag)"
    :key="id || getTagId(tag)"
    :isLazy="isLazyTag(tag)">
    <Component
      :is="tagLayout"
      :id="id || getTagId(tag)"
      :collection="collection"
      :spec="spec"
      :tag="tag">
      <Lazy
        v-for="(transformedOperation, operationIndex) in tag.operations"
        :id="transformedOperation.id"
        :key="transformedOperation.id"
        :isLazy="
          operationIndex < currentOperationIndex(tag) ||
          operationIndex > currentOperationIndex(tag) + 3
        ">
        <ScalarErrorBoundary>
          <Operation
            :ref="
              (el: ComponentPublicInstance | null) =>
                handleOperationRef(el, operationIndex, tag)
            "
            :path="transformedOperation.path"
            :method="transformedOperation.httpVerb"
            :isWebhook="transformedOperation.isWebhook"
            :id="transformedOperation.id"
            :document="document"
            :collection="collection"
            :layout="layout"
            :server="server" />
        </ScalarErrorBoundary>
      </Lazy>
    </Component>
  </Lazy>
</template>
