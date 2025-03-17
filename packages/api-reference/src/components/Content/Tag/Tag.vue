<script setup lang="ts">
import { ScalarMarkdown } from '@scalar/components'
import type { Collection } from '@scalar/oas-utils/entities/spec'
import type { Tag } from '@scalar/types/legacy'
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
import { useNavState } from '@/hooks/useNavState'

import OperationsList from './OperationsList.vue'

const props = defineProps<{
  id?: string
  tag: Tag
  collection: Collection
  headerId?: string
  isCollapsed?: boolean
}>()

const { getTagId } = useNavState()

const title = computed(() => props.tag['x-displayName'] ?? props.tag.name)
</script>
<template>
  <Section
    :id="id"
    :label="tag.name.toUpperCase()"
    role="none">
    <SectionHeader>
      <Anchor :id="getTagId(tag)">
        <SectionHeaderTag
          :id="headerId"
          :level="2">
          {{ title }}
          <ScreenReader v-if="isCollapsed"> (Collapsed)</ScreenReader>
        </SectionHeaderTag>
      </Anchor>
    </SectionHeader>
    <SectionContent>
      <SectionColumns>
        <SectionColumn>
          <ScalarMarkdown
            :clamp="isCollapsed ? '7' : false"
            :value="tag.description"
            withImages />
        </SectionColumn>
        <SectionColumn>
          <OperationsList
            :collection="collection"
            :tag="tag" />
        </SectionColumn>
      </SectionColumns>
    </SectionContent>
  </Section>
</template>
