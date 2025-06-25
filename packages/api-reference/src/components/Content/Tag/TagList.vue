<script setup lang="ts">
import { ScalarErrorBoundary } from '@scalar/components'
import type { Collection, Server } from '@scalar/oas-utils/entities/spec'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { Spec, Tag as TagType } from '@scalar/types/legacy'
import { computed } from 'vue'

import { Lazy } from '@/components/Content/Lazy'
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

/**
 * All tags on the list UNTIL the one afterfirst open tag should not be lazy loaded. However their operations should be.
 * This so so we can get to the first open tag + operation as quick as possible and avoid any jumps
 */
const lazyIndex = computed(
  () => tags.findIndex((tag) => !collapsedSidebarItems[getTagId(tag)]) + 1,
)

/** If the first load is models, we do not lazy load tags/operations */
const isLazy = (index: number) =>
  layout !== 'classic' &&
  !hash.value.startsWith('model') &&
  index > lazyIndex.value
</script>
<template>
  <Lazy
    v-for="(tag, index) in tags"
    :id="id || getTagId(tag)"
    :key="id || getTagId(tag)"
    :isLazy="isLazy(index)">
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
          isLazy(index) ||
          (collapsedSidebarItems[getTagId(tag)] && operationIndex > 0)
        ">
        <ScalarErrorBoundary>
          <Operation
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
