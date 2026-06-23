<script setup lang="ts">
import type { AsyncApiInfoObject } from '@scalar/types/asyncapi/3.1'
import type { Heading } from '@scalar/types/legacy'
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
import { useApiReferenceI18n } from '@/features/i18n'
import { SpecificationExtension } from '@/features/specification-extension'

import InfoDescription from './InfoDescription.vue'
import InfoLinks from './InfoLinks.vue'
import InfoVersion from './InfoVersion.vue'
import IntroductionLoading from './IntroductionLoading.vue'
import SpecificationVersion from './SpecificationVersion.vue'

defineProps<{
  id: string | undefined
  documentType?: 'openapi' | 'asyncapi'
  specificationVersion: string | undefined
  info: InfoObject | AsyncApiInfoObject | undefined
  externalDocs?: ExternalDocumentationObject
  documentExtensions?: Record<string, unknown>
  infoExtensions?: Record<string, unknown>
  headingSlugGenerator: (heading: Heading) => string
  eventBus: WorkspaceEventBus | null
}>()

const { translate } = useApiReferenceI18n()
</script>

<template>
  <SectionContainer>
    <!-- If the #after slot is used, we need to add a gap to the section. -->
    <Section
      :id="id"
      :aria-label="translate('navigation.introduction')"
      class="introduction-section z-1 gap-12"
      @intersecting="
        () => id && eventBus?.emit('intersecting:nav-item', { id })
      ">
      <SectionContent>
        <!-- While the document loads we show a skeleton that mirrors this layout. -->
        <IntroductionLoading
          v-if="!info"
          :hasAside="Boolean($slots.aside)" />

        <template v-else>
          <div class="flex gap-1.5">
            <InfoVersion :version="info?.version" />
            <SpecificationVersion
              :documentType
              :version="specificationVersion" />
          </div>
          <SectionHeader tight>
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
        </template>
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
