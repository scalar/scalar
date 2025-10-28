<script setup lang="ts">
import type { Heading } from '@scalar/types'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type {
  ExternalDocumentationObject,
  InfoObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

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

import InfoDescription from './InfoDescription.vue'
import InfoLinks from './InfoLinks.vue'
import InfoVersion from './InfoVersion.vue'
import OpenApiVersion from './OpenApiVersion.vue'

defineProps<{
  id: string | undefined
  oasVersion: string | undefined
  info: InfoObject | undefined
  externalDocs?: ExternalDocumentationObject
  documentExtensions?: Record<string, unknown>
  infoExtensions?: Record<string, unknown>
  headingSlugGenerator: (heading: Heading) => string
  eventBus: WorkspaceEventBus | null
}>()
</script>

<template>
  <SectionContainer>
    <!-- If the #after slot is used, we need to add a gap to the section. -->
    <Section
      :id="id"
      class="introduction-section z-1 gap-12"
      @intersecting="
        () => id && eventBus?.emit('intersecting:nav-item', { id })
      ">
      <SectionContent :loading="!info">
        <div class="flex gap-1.5">
          <InfoVersion
            v-if="info"
            :version="info?.version" />
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
              v-if="info"
              :externalDocs="externalDocs"
              :info="info" />
          </template>
        </SectionHeader>
        <SectionColumns>
          <SectionColumn>
            <slot name="download-link" />
            <InfoDescription
              :description="info?.description"
              :eventBus="eventBus"
              :headingSlugGenerator="headingSlugGenerator" />
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
  top: calc(var(--refs-viewport-offset) + 24px);
}
</style>
