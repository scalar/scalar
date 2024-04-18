<script setup lang="ts">
import { ref } from 'vue'

import { useNavState, useSidebar } from '../../../hooks'
import type { Spec, Tag } from '../../../types'
import { SectionContainer } from '../../Section'
import ShowMoreButton from '../../ShowMoreButton.vue'
import Endpoints from './Endpoints.vue'
import { observeMutations } from './mutationObserver'

const props = defineProps<{
  id?: string
  tag: Tag
  spec: Spec
}>()

const sectionContainerRef = ref<HTMLElement | null>(null)

const { collapsedSidebarItems } = useSidebar()
const { getTagId } = useNavState()

const moreThanOneDefaultTag = (tag: Tag) =>
  props.spec.tags?.length !== 1 ||
  tag?.name !== 'default' ||
  tag?.description !== ''

const redirectToOperation = (operationId: string) => {
  window.location.href = `#${operationId}`
}

const observeSectionMutations = (operationId: string) => {
  observeMutations(sectionContainerRef, (mutations, observer) => {
    mutations.forEach((mutation) => {
      const operationIsAdded = Array.from(mutation.addedNodes).some((node) => {
        return node instanceof HTMLElement && node.id === operationId
      })
      if (operationIsAdded) {
        redirectToOperation(operationId)
        observer.disconnect()
      }
    })
  })
}

const observeAndNavigate = (operationId: string) => {
  const operationIsVisible = document.getElementById(operationId)
  if (!operationIsVisible) {
    observeSectionMutations(operationId)
  } else {
    redirectToOperation(operationId)
  }
}
</script>
<template>
  <SectionContainer
    ref="sectionContainerRef"
    class="tag-section-container">
    <Endpoints
      v-if="moreThanOneDefaultTag(tag)"
      :id="id"
      :tag="tag"
      @observeAndNavigate="observeAndNavigate" />
    <ShowMoreButton
      v-if="!collapsedSidebarItems[getTagId(tag)] && tag.operations?.length > 1"
      :id="id ?? ''" />
    <template v-else>
      <slot />
    </template>
  </SectionContainer>
</template>
<style scoped>
.section-container {
  border-top: 1px solid var(--scalar-border-color);
}
</style>
