<script setup lang="ts">
import type { Spec, Tag as tagType } from '@scalar/types/legacy'
import { computed } from 'vue'

import { useNavState, useSidebar } from '../../../hooks'
import { Lazy } from '../Lazy'
import { Operation, OperationAccordion } from '../Operation'
import { Tag, TagAccordion } from './'

const props = defineProps<{
  tags: tagType[]
  spec: Spec
  layout?: 'default' | 'accordion'
}>()

const { getOperationId, getTagId, hash } = useNavState()
const { collapsedSidebarItems } = useSidebar()

const tagLayout = computed<typeof Tag>(() =>
  props.layout === 'accordion' ? TagAccordion : Tag,
)

const endpointLayout = computed<typeof Operation>(() =>
  props.layout === 'accordion' ? OperationAccordion : Operation,
)

// If the first load is models, we do not lazy load tags/operations
const isLazy = props.layout !== 'accordion' && !hash.value.startsWith('model')
</script>
<template>
  <Lazy
    v-for="tag in tags"
    :id="getTagId(tag)"
    :key="getTagId(tag)"
    :isLazy="isLazy && !collapsedSidebarItems[getTagId(tag)]">
    <Component
      :is="tagLayout"
      :id="getTagId(tag)"
      :spec="spec"
      :tag="tag">
      <Lazy
        v-for="(operation, operationIndex) in tag.operations"
        :id="getOperationId(operation, tag)"
        :key="`${operation.httpVerb}-${operation.operationId}`"
        :isLazy="operationIndex > 0">
        <Component
          :is="endpointLayout"
          :id="getOperationId(operation, tag)"
          :operation="operation"
          :tag="tag" />
      </Lazy>
    </Component>
  </Lazy>
</template>
