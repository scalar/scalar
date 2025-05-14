<script setup lang="ts">
import { ScalarMarkdown } from '@scalar/components'
import type { Tag } from '@scalar/types/legacy'

import { Anchor } from '@/components/Anchor'
import {
  SectionContainerAccordion,
  SectionHeader,
  SectionHeaderTag,
} from '@/components/Section'
import { useNavState } from '@/hooks/useNavState'

defineProps<{
  tag: Tag
}>()

const { getTagId } = useNavState()
</script>
<template>
  <SectionContainerAccordion class="tag-section">
    <template #title>
      <SectionHeader class="tag-name">
        <Anchor :id="getTagId(tag)">
          <SectionHeaderTag :level="2">
            {{ tag.name }}
          </SectionHeaderTag>
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
  text-align: left;
}
</style>
