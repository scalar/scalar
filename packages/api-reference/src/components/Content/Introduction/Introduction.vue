<script setup lang="ts">
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { computed, inject, onMounted, type Ref } from 'vue'

import { Badge } from '@/components/Badge'
import {
  Section,
  SectionColumn,
  SectionColumns,
  SectionContainer,
  SectionContent,
  SectionHeader,
  SectionHeaderTag,
} from '@/components/Section'
import { OPENAPI_VERSION_SYMBOL } from '@/features/download-link'
import DownloadLink from '@/features/download-link/DownloadLink.vue'
import { SpecificationExtension } from '@/features/specification-extension'
import { DEFAULT_INTRODUCTION_SLUG } from '@/features/traverse-schema'
import { useConfig } from '@/hooks/useConfig'
import { useNavState } from '@/hooks/useNavState'

import Description from './Description.vue'

const { document } = defineProps<{
  document: OpenAPIV3_1.Document
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
const config = useConfig()
onMounted(() => config.value.onLoaded?.())
</script>
<template>
  <SectionContainer>
    <!-- If the #after slot is used, we need to add a gap to the section. -->
    <Section
      class="introduction-section gap-12"
      :id="
        getHeadingId({
          slug: DEFAULT_INTRODUCTION_SLUG,
          depth: 1,
          value: 'Introduction',
        })
      ">
      <SectionContent
        :loading="
          config.isLoading ??
          (!document?.info?.description && !document?.info?.title)
        ">
        <div class="flex gap-1">
          <Badge v-if="version">{{ version }}</Badge>
          <Badge v-if="oasVersion">OAS {{ oasVersion }}</Badge>
        </div>
        <SectionHeader
          :loading="!document.info?.title"
          tight>
          <SectionHeaderTag :level="1">
            {{ document.info?.title }}
          </SectionHeaderTag>
        </SectionHeader>
        <SectionColumns>
          <SectionColumn>
            <DownloadLink :title="document.info?.title" />
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
