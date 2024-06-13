<!-- eslint-disable vue/no-unused-properties -->
<script setup lang="ts">
import { ScalarMarkdown } from '@scalar/components'
import type { Spec, Tag } from '@scalar/oas-utils'

import { useNavState } from '../../../hooks'
import { Anchor } from '../../Anchor'
import { SectionContainerAccordion, SectionHeader } from '../../Section'

defineProps<{
  tag: Tag
  spec: Spec
}>()

const { getTagId } = useNavState()
</script>
<template>
  <SectionContainerAccordion class="tag-section">
    <template #title>
      <SectionHeader
        class="tag-name"
        :level="2">
        <Anchor :id="getTagId(tag)">
          {{ tag.name }}
        </Anchor>
      </SectionHeader>
      <ScalarMarkdown
        class="tag-description"
        :value="tag.description"
        withImages />
    </template>
    <slot />
  </SectionContainerAccordion>
</template>
<style scoped>
.tag-section {
  margin-bottom: 48px;
}
.tag-name {
  text-transform: capitalize;
}
.tag-description {
  padding-bottom: 4px;
}
</style>
