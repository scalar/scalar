<script setup lang="ts">
import type { ApiReferenceConfiguration } from '@scalar/types/api-reference'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { onMounted } from 'vue'

import ScalarInfoLinks from '@/components/Content/Introduction/ScalarInfoLinks.vue'
import ScalarInfoVersion from '@/components/Content/Introduction/ScalarInfoVersion.vue'
import ScalarOpenApiVersion from '@/components/Content/Introduction/ScalarOpenApiVersion.vue'
import {
  Section,
  SectionColumn,
  SectionColumns,
  SectionContainer,
  SectionContent,
  SectionHeader,
  SectionHeaderTag,
} from '@/components/Section'
import { DownloadLinks } from '@/features/download-links'
import { SpecificationExtension } from '@/features/specification-extension'
import { DEFAULT_INTRODUCTION_SLUG } from '@/features/traverse-schema'
import { useNavState } from '@/hooks/useNavState'

import ScalarInfoDescription from './ScalarInfoDescription.vue'

const { document, config } = defineProps<{
  document: OpenApiDocument
  config?: ApiReferenceConfiguration
}>()

const { getHeadingId } = useNavState()

/** Trigger the onLoaded event when the component is mounted */
onMounted(() => config?.onLoaded?.())
</script>

<template>
  <SectionContainer>
    <!-- If the #after slot is used, we need to add a gap to the section. -->
    <Section
      class="introduction-section z-1 gap-12"
      :id="
        getHeadingId({
          slug: DEFAULT_INTRODUCTION_SLUG,
          depth: 1,
          value: 'Introduction',
        })
      ">
      <SectionContent
        :loading="
          config?.isLoading ??
          (!document?.info?.description && !document?.info?.title)
        ">
        <div class="flex gap-1.5">
          <ScalarInfoVersion :version="document.info?.version" />
          <ScalarOpenApiVersion />
        </div>
        <SectionHeader
          :loading="!document.info?.title"
          tight>
          <SectionHeaderTag :level="1">
            {{ document.info?.title }}
          </SectionHeaderTag>
          <template #links>
            <ScalarInfoLinks :document="document" />
          </template>
        </SectionHeader>
        <SectionColumns>
          <SectionColumn>
            <DownloadLinks :title="document.info?.title" />
            <ScalarInfoDescription :description="document.info?.description" />
          </SectionColumn>
          <SectionColumn v-if="$slots.aside">
            <div class="sticky-cards">
              <slot name="aside" />
            </div>
          </SectionColumn>
        </SectionColumns>
        <SpecificationExtension :value="document" />
        <SpecificationExtension :value="document.info" />
      </SectionContent>
      <slot name="after" />
    </Section>
  </SectionContainer>
</template>
<style scoped>
.sticky-cards {
  display: flex;
  flex-direction: column;
  position: sticky;
  top: calc(var(--refs-header-height) + 24px);
}
</style>
