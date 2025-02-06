<script setup lang="ts">
import { Lazy } from '@/components/Content/Lazy'
import { Operation } from '@/features/Operation'
import { useNavState, useSidebar } from '@/hooks'
import { useActiveEntities } from '@scalar/api-client/store'
import { ScalarErrorBoundary } from '@scalar/components'
import type { Spec, Tag as TagType } from '@scalar/types/legacy'
import { computed } from 'vue'

import { Tag, TagAccordion } from './'

const props = defineProps<{
  tags: TagType[]
  spec: Spec
  layout?: 'modern' | 'classic'
}>()

const { getOperationId, getTagId, hash } = useNavState()
const { collapsedSidebarItems } = useSidebar()
const { activeCollection, activeServer } = useActiveEntities()

const tagLayout = computed(() =>
  props.layout === 'classic' ? TagAccordion : Tag,
)

/**
 * All tags on the list UNTIL the one afterfirst open tag should not be lazy loaded. However their operations should be.
 * This so so we can get to the first open tag + operation as quick as possible and avoid any jumps
 */
const lazyIndex = computed(
  () =>
    props.tags.findIndex((tag) => !collapsedSidebarItems[getTagId(tag)]) + 1,
)

/** If the first load is models, we do not lazy load tags/operations */
const isLazy = (index: number) =>
  props.layout !== 'classic' &&
  !hash.value.startsWith('model') &&
  index > lazyIndex.value
</script>
<template>
  <Lazy
    v-for="(tag, index) in tags"
    :id="getTagId(tag)"
    :key="getTagId(tag)"
    :isLazy="isLazy(index)">
    <Component
      :is="tagLayout"
      :id="getTagId(tag)"
      :spec="spec"
      :tag="tag">
      <Lazy
        v-for="(operation, operationIndex) in tag.operations"
        :id="getOperationId(operation, tag)"
        :key="`${operation.httpVerb}-${operation.operationId}`"
        :isLazy="
          isLazy(index) ||
          (collapsedSidebarItems[getTagId(tag)] && operationIndex > 0)
        ">
        <ScalarErrorBoundary>
          <Operation
            :id="getOperationId(operation, tag)"
            :collection="activeCollection"
            :layout="layout"
            :server="activeServer"
            :transformedOperation="operation" />
        </ScalarErrorBoundary>
      </Lazy>
    </Component>
  </Lazy>
</template>
