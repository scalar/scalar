<script setup lang="ts">
import { Lazy } from '@/components/Content/Lazy'
import { Operation } from '@/features/Operation'
import { useNavState, useSidebar } from '@/hooks'
import { useWorkspace } from '@scalar/api-client/store'
import { ScalarErrorBoundary } from '@scalar/components'
import type { Spec, Tag as tagType } from '@scalar/types/legacy'
import { computed } from 'vue'

import { Tag, TagAccordion } from './'

const props = defineProps<{
  tags: tagType[]
  spec: Spec
  layout?: 'modern' | 'classic'
}>()

const { getOperationId, getTagId, hash } = useNavState()
const { collapsedSidebarItems } = useSidebar()
const { requests, requestExamples, securitySchemes } = useWorkspace()

const tagLayout = computed(() =>
  props.layout === 'classic' ? TagAccordion : Tag,
)

// If the first load is models, we do not lazy load tags/operations
const isLazy = props.layout !== 'classic' && !hash.value.startsWith('model')
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
        <ScalarErrorBoundary>
          <Operation
            :id="getOperationId(operation, tag)"
            :layout="layout"
            :operation="operation"
            :requestExamples="requestExamples"
            :requests="requests"
            :securitySchemes="securitySchemes"
            :tag="tag" />
        </ScalarErrorBoundary>
      </Lazy>
    </Component>
  </Lazy>
</template>
