<script setup lang="ts">
import { ScalarMarkdown } from '@scalar/components'

import { Anchor } from '@/components/Anchor'
import { Lazy } from '@/components/Lazy'
import { OperationsList } from '@/components/OperationsList'
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

const { tag, headerId, isCollapsed } = defineProps<{
  tag: TraversedTag
  headerId?: string
  isCollapsed?: boolean
}>()

const config = useConfig()
const { hash, getTagId } = useNavState()
</script>
<template>
  <Lazy
    :id="getTagId(tag)"
    :isLazy="Boolean(hash) && hash !== getTagId(tag)">
    <Section
      v-if="tag"
      :id="tag.id"
      :label="tag.title?.toUpperCase()"
      role="none">
      <SectionHeader v-show="!config.isLoading">
        <Anchor :id="tag.id">
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
      <SpecificationExtension :value="tag.tag" />
    </Section>
  </Lazy>
</template>
