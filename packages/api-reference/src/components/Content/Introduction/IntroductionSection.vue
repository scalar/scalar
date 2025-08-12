<script setup lang="ts">
import type { ApiReferenceConfiguration } from '@scalar/types/api-reference'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed, inject, onMounted, type Ref } from 'vue'

import { Badge } from '@/components/Badge'
import { LinkList } from '@/components/LinkList'
import {
  Section,
  SectionColumn,
  SectionColumns,
  SectionContainer,
  SectionContent,
  SectionHeader,
  SectionHeaderTag,
} from '@/components/Section'
import { DownloadLink, OPENAPI_VERSION_SYMBOL } from '@/features/download-link'
import { ExternalDocs } from '@/features/external-docs'
import { Contact, License, TermsOfService } from '@/features/info-object'
import { SpecificationExtension } from '@/features/specification-extension'
import { DEFAULT_INTRODUCTION_SLUG } from '@/features/traverse-schema'
import { useNavState } from '@/hooks/useNavState'

import Description from './Description.vue'

const { document, config } = defineProps<{
  document: OpenApiDocument
  config?: ApiReferenceConfiguration
}>()

const { getHeadingId } = useNavState()

/**
 * Get the OpenAPI/Swagger specification version from the API definition.
 */
const oasVersion = inject<Ref<string | undefined>>(OPENAPI_VERSION_SYMBOL)

/** Format the version number to be displayed in the badge */
const version = computed(() => {
  // Prefix the version with “v” if the first character is a number, don't prefix if it's not.
  // Don't output anything when version is not a string.
  return typeof document.info?.version === 'string'
    ? document.info.version.toString().match(/^\d/)
      ? `v${document.info.version}`
      : document.info.version
    : typeof document.info?.version === 'number'
      ? `v${document.info.version}`
      : undefined
})

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
          <Badge v-if="version">{{ version }}</Badge>
          <Badge v-if="oasVersion">OAS {{ oasVersion }}</Badge>
        </div>
        <SectionHeader
          :loading="!document.info?.title"
          tight>
          <SectionHeaderTag :level="1">
            {{ document.info?.title }}
          </SectionHeaderTag>
          <template #links>
            <LinkList>
              <ExternalDocs :value="document.externalDocs" />
              <Contact
                v-if="document.info?.contact"
                :value="document.info?.contact" />
              <License
                v-if="document.info?.license"
                :value="document.info?.license" />
              <TermsOfService
                v-if="document.info?.termsOfService"
                :value="document.info?.termsOfService" />
            </LinkList>
          </template>
        </SectionHeader>
        <SectionColumns>
          <SectionColumn>
            <div class="links">
              <DownloadLink :title="document.info?.title" />
            </div>
            <Description :value="document.info?.description" />
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
