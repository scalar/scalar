<script setup lang="ts">
import type { AsyncApiInfoObject } from '@scalar/types/asyncapi/3.1'
import type { Heading } from '@scalar/types/legacy'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type {
  ExternalDocumentationObject,
  InfoObject,
} from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { computed } from 'vue'

import {
  Section,
  SectionColumn,
  SectionColumns,
  SectionContainer,
  SectionContent,
  SectionHeader,
  SectionHeaderTag,
} from '@/components/Section'
import { useDocumentOutline } from '@/features/document-outline'
import { useLocalization } from '@/features/localization'
import { SpecificationExtension } from '@/features/specification-extension'

import InfoDescription from './InfoDescription.vue'
import InfoLinks from './InfoLinks.vue'
import InfoVersion from './InfoVersion.vue'
import IntroductionLoading from './IntroductionLoading.vue'
import SpecificationVersion from './SpecificationVersion.vue'

const { applicationIdentifier, documentType } = defineProps<{
  id: string | undefined
  /** AsyncAPI root identifier, separate from the section navigation anchor. */
  applicationIdentifier?: string
  documentType?: 'openapi' | 'asyncapi'
  specificationVersion: string | undefined
  info: InfoObject | AsyncApiInfoObject | undefined
  externalDocs?: ExternalDocumentationObject
  documentExtensions?: Record<string, unknown>
  infoExtensions?: Record<string, unknown>
  /** Extensions belonging to the Paths Object, rendered once per document. */
  pathsExtensions?: Record<string, unknown>
  /** Selected keys for the default Paths Object extension renderer. */
  showExtensions?: string[]
  headingSlugGenerator: (heading: Heading) => string
  eventBus: WorkspaceEventBus | null
}>()

defineSlots<{
  'actions'?: () => unknown
  'download-link'?: () => unknown
  'aside'?: () => unknown
  'after'?: () => unknown
}>()

const showApplicationIdentifier = computed<boolean>(
  () => documentType === 'asyncapi' && Boolean(applicationIdentifier),
)

const { translate } = useLocalization()

const { level: headingLevel } = useDocumentOutline('document')
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
            <SectionHeaderTag :level="headingLevel">
              {{ info?.title }}
            </SectionHeaderTag>
            <template #links>
              <!-- Keep the original links layout when no custom actions are supplied. -->
              <div
                :class="
                  $slots.actions
                    ? 'flex flex-wrap items-start justify-end gap-3'
                    : 'contents'
                ">
                <InfoLinks
                  :externalDocs="externalDocs"
                  :info="info" />
                <slot name="actions" />
              </div>
            </template>
          </SectionHeader>
          <SectionColumns>
            <SectionColumn>
              <slot name="download-link" />
              <InfoDescription
                :description="info?.description"
                :eventBus="eventBus"
                :headingSlugGenerator="headingSlugGenerator" />
              <dl
                v-if="showApplicationIdentifier"
                class="text-c-2 mt-6 flex flex-col gap-1 text-sm">
                <dt class="text-c-1">
                  {{ translate('asyncapi.applicationIdentifier') }}
                </dt>
                <dd class="font-code [overflow-wrap:anywhere]">
                  {{ applicationIdentifier }}
                </dd>
              </dl>
            </SectionColumn>
            <SectionColumn v-if="$slots.aside">
              <div class="sticky-cards">
                <slot name="aside" />
              </div>
            </SectionColumn>
          </SectionColumns>
          <SpecificationExtension :value="documentExtensions" />
          <SpecificationExtension :value="infoExtensions" />
          <SpecificationExtension
            :label="translate('common.paths')"
            :showExtensions
            :value="pathsExtensions" />
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
