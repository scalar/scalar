<script setup lang="ts">
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { Spec } from '@scalar/types/legacy'
import { computed, inject, onMounted, type Ref } from 'vue'

import { SpecificationExtension } from '@/components/SpecificationExtension'
import { OPENAPI_VERSION_SYMBOL } from '@/features/DownloadLink'
import { useConfig } from '@/hooks/useConfig'
import { useNavState } from '@/hooks/useNavState'
import { DEFAULT_INTRODUCTION_SLUG } from '@/hooks/useSidebar'

import DownloadLink from '../../../features/DownloadLink/DownloadLink.vue'
import { Badge } from '../../Badge'
import {
  Section,
  SectionColumn,
  SectionColumns,
  SectionContainer,
  SectionContent,
  SectionHeader,
  SectionHeaderTag,
} from '../../Section'
import Description from './Description.vue'

const props = defineProps<{
  info: Partial<OpenAPIV3_1.InfoObject>
  parsedSpec: Spec
}>()

const { getHeadingId } = useNavState()

/**
 * Get the OpenAPI/Swagger specification version from the API definition.
 */
const oasVersion = inject<Ref<string | undefined>>(OPENAPI_VERSION_SYMBOL)

/** Format the version number to be displayed in the badge */
const version = computed(() => {
  // Prefix the version with “v” if the first character is a number, don’t prefix if it’s not.
  // Don’t output anything when version is not a string.
  return typeof props.info?.version === 'string'
    ? props.info.version.toString().match(/^\d/)
      ? `v${props.info.version}`
      : props.info.version
    : typeof props.info?.version === 'number'
      ? `v${props.info.version}`
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
        :loading="config.isLoading ?? (!info?.description && !info?.title)">
        <div class="flex gap-1">
          <Badge v-if="version">{{ version }}</Badge>
          <Badge v-if="oasVersion">OAS {{ oasVersion }}</Badge>
        </div>
        <SectionHeader
          :loading="!info.title"
          tight>
          <SectionHeaderTag :level="1">
            {{ info.title }}
          </SectionHeaderTag>
        </SectionHeader>
        <SectionColumns>
          <SectionColumn>
            <DownloadLink :title="info.title" />
            <Description :value="info.description" />
          </SectionColumn>
          <SectionColumn v-if="$slots.aside">
            <div class="sticky-cards">
              <slot name="aside" />
            </div>
          </SectionColumn>
        </SectionColumns>
        <SpecificationExtension :value="parsedSpec" />
        <SpecificationExtension :value="info" />
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
