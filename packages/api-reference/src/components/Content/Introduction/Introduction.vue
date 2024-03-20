<script setup lang="ts">
import {
  type OpenAPIV2,
  type OpenAPIV3,
  type OpenAPIV3_1,
} from '@scalar/openapi-parser'
import { computed } from 'vue'

import type { Spec } from '../../../types'
import { Badge } from '../../Badge'
import {
  Section,
  SectionColumn,
  SectionColumns,
  SectionContainer,
  SectionContent,
  SectionHeader,
} from '../../Section'
import Description from './Description.vue'
import DownloadSpec from './DownloadSpec.vue'

const props = defineProps<{
  info: Partial<
    OpenAPIV2.InfoObject | OpenAPIV3.InfoObject | OpenAPIV3_1.InfoObject
  >
  parsedSpec: Spec
}>()

const specVersion = computed(() => {
  return props.parsedSpec.openapi ?? props.parsedSpec.swagger ?? ''
})
</script>
<template>
  <SectionContainer>
    <!-- For adding gradients + animations to introduction of documents that :before / :after won't work for -->
    <div class="section-flare">
      <div class="section-flare-item"></div>
      <div class="section-flare-item"></div>
      <div class="section-flare-item"></div>
      <div class="section-flare-item"></div>
      <div class="section-flare-item"></div>
      <div class="section-flare-item"></div>
      <div class="section-flare-item"></div>
      <div class="section-flare-item"></div>
    </div>
    <Section class="introduction-section">
      <SectionContent :loading="!info.description && !info.title">
        <SectionColumns>
          <SectionColumn>
            <div class="badges">
              <Badge v-if="info.version">
                {{ info.version }}
              </Badge>
              <Badge v-if="specVersion"> OAS {{ specVersion }}</Badge>
            </div>
            <SectionHeader
              :level="1"
              :loading="!info.title"
              tight>
              {{ info.title }}
            </SectionHeader>
            <DownloadSpec />
            <Description :value="info.description" />
          </SectionColumn>
          <SectionColumn v-if="$slots.aside">
            <div class="sticky-cards">
              <slot name="aside" />
            </div>
          </SectionColumn>
        </SectionColumns>
      </SectionContent>
      <slot name="after" />
    </Section>
  </SectionContainer>
</template>
<style scoped>
.heading {
  margin-top: 0px !important;
  word-wrap: break-word;
}
.loading {
  background: var(--theme-background-3, var(--default-theme-background-3));
  animation: loading-skeleton 1.5s infinite alternate;
  border-radius: var(--theme-radius-lg, var(--default-theme-radius-lg));
}
.badges {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 3px;
}
.heading.loading {
  width: 80%;
}
.introduction-section {
  gap: 48px;
}
.sticky-cards {
  display: flex;
  flex-direction: column;

  position: sticky;
  top: calc(var(--refs-header-height) + 24px);
}
.section-flare {
  position: absolute;
  top: 0;
  right: 0;
  pointer-events: none;
  z-index: -1;
}
</style>
