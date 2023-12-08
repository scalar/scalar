<script setup lang="ts">
import { computed } from 'vue'

import type { Info, Spec } from '../../../types'
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
  info: Info
  parsedSpec: Spec
  rawSpec: string
}>()

const specVersion = computed(() => {
  return props.parsedSpec.openapi ?? props.parsedSpec.swagger ?? ''
})
</script>
<template>
  <SectionContainer>
    <Section>
      <SectionContent :loading="!info.description && !info.title">
        <SectionColumns>
          <SectionColumn>
            <Badge v-if="info.version">
              {{ info.version }}
            </Badge>
            <Badge v-if="specVersion"> OAS {{ specVersion }} </Badge>
            <SectionHeader
              :level="1"
              :loading="!info.title"
              tight>
              {{ info.title }}
            </SectionHeader>
            <DownloadSpec :value="rawSpec" />
            <Description :value="info.description" />
          </SectionColumn>
          <SectionColumn v-if="$slots.aside">
            <div class="sticky-cards">
              <slot name="aside" />
            </div>
          </SectionColumn>
        </SectionColumns>
      </SectionContent>
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
.heading.loading {
  width: 80%;
}
.sticky-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;

  position: sticky;
  top: calc(var(--refs-header-height) + 24px);
}
</style>
