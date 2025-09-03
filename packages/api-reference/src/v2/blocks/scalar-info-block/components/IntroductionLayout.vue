<script setup lang="ts">
import type {
  ExternalDocumentationObject,
  InfoObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
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
import { SpecificationExtension } from '@/features/specification-extension'

import DownloadLink from './DownloadLink.vue'
import InfoDescription from './InfoDescription.vue'
import InfoLinks from './InfoLinks.vue'
import InfoVersion from './InfoVersion.vue'
import OpenApiVersion from './OpenApiVersion.vue'

const { onLoaded } = defineProps<{
  oasVersion?: string
  info: InfoObject
  externalDocs?: ExternalDocumentationObject
  documentExtensions?: Record<string, unknown>
  infoExtensions?: Record<string, unknown>
  isLoading?: boolean
  getOriginalDocument: () => string
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
      :id
      class="introduction-section z-1 gap-12">
      <SectionContent
        :loading="isLoading ?? (!info?.description && !info?.title)">
        <div class="flex gap-1.5">
          <InfoVersion :version="info?.version" />
          <OpenApiVersion :oasVersion="oasVersion" />
        </div>
        <SectionHeader
          :loading="!info?.title"
          tight>
          <SectionHeaderTag :level="1">
            {{ info?.title }}
          </SectionHeaderTag>
          <template #links>
            <InfoLinks
              :externalDocs="externalDocs"
              :info="info" />
          </template>
        </SectionHeader>
        <SectionColumns>
          <SectionColumn>
            <DownloadLink
              :getOriginalDocument
              :title="info?.title" />
            <InfoDescription :description="info?.description" />
          </SectionColumn>
          <SectionColumn v-if="$slots.aside">
            <div class="sticky-cards">
              <slot name="aside" />
            </div>
          </SectionColumn>
        </SectionColumns>
        <SpecificationExtension :value="documentExtensions" />
        <SpecificationExtension :value="infoExtensions" />
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
