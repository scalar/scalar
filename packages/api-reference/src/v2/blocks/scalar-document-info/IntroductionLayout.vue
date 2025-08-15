<script setup lang="ts">
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { onMounted } from 'vue'

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

import InfoDescription from './InfoDescription.vue'
import InfoLinks from './InfoLinks.vue'
import InfoVersion from './InfoVersion.vue'
import OpenApiVersion from './OpenApiVersion.vue'

const { document, onLoaded } = defineProps<{
  document: OpenApiDocument
  isLoading?: boolean
  onLoaded?: () => void
  id?: string
}>()

/** Trigger the onLoaded event when the component is mounted */
onMounted(() => onLoaded?.())
</script>

<template>
  <SectionContainer>
    <!-- If the #after slot is used, we need to add a gap to the section. -->
    <Section
      class="introduction-section z-1 gap-12"
      :id>
      <SectionContent
        :loading="
          isLoading ?? (!document?.info?.description && !document?.info?.title)
        ">
        <div class="flex gap-1.5">
          <InfoVersion :version="document.info?.version" />
          <OpenApiVersion />
        </div>
        <SectionHeader
          :loading="!document.info?.title"
          tight>
          <SectionHeaderTag :level="1">
            {{ document.info?.title }}
          </SectionHeaderTag>
          <template #links>
            <InfoLinks
              :info="document.info"
              :externalDocs="document.externalDocs" />
          </template>
        </SectionHeader>
        <SectionColumns>
          <SectionColumn>
            <DownloadLinks :title="document.info?.title" />
            <InfoDescription :description="document.info?.description" />
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
