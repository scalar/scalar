<script setup lang="ts">
import { ScalarMarkdown } from '@scalar/components'
import { computed } from 'vue'

import { Anchor } from '@/components/Anchor'
import ScreenReader from '@/components/ScreenReader.vue'
import {
  Section,
  SectionColumn,
  SectionColumns,
  SectionContent,
  SectionHeader,
  SectionHeaderTag,
} from '@/components/Section'
import { SpecificationExtension } from '@/features/specification-extension'
import type { TraversedTag } from '@/features/traverse-schema'
import { useConfig } from '@/hooks/useConfig'
import { useNavState } from '@/hooks/useNavState'

import OperationsList from './OperationsList.vue'

const { id, tag, headerId, isCollapsed } = defineProps<{
  id?: string
  tag: TraversedTag
  headerId?: string
  isCollapsed?: boolean
}>()

const { getTagId } = useNavState()
const config = useConfig()

const tagId = computed(
  () =>
    id ||
    getTagId({
      name: tag.title,
      description: tag.tag?.description ?? '',
    }) ||
    '',
)
</script>
<template>
  <Section
    v-if="tag"
    :id="tagId"
    :label="tag.title?.toUpperCase()"
    role="none">
    <SectionHeader v-show="!config.isLoading">
      <Anchor :id="tagId">
        <SectionHeaderTag
          :id="headerId"
          :level="2">
          {{ tag.title }}
          <ScreenReader v-if="isCollapsed"> (Collapsed)</ScreenReader>
        </SectionHeaderTag>
      </Anchor>
    </SectionHeader>
    <SectionContent :loading="config.isLoading">
      <SectionColumns>
        <SectionColumn>
          <ScalarMarkdown
            :clamp="isCollapsed ? '7' : false"
            :value="tag.tag?.description ?? ''"
            withImages />
        </SectionColumn>
        <SectionColumn>
          <OperationsList :tag="tag" />
        </SectionColumn>
      </SectionColumns>
    </SectionContent>
    <SpecificationExtension :value="tag" />
  </Section>
</template>
