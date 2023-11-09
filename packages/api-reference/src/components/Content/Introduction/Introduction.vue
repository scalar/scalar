<script setup lang="ts">
import { computed } from 'vue'

import { useTemplateStore } from '../../../stores/template'
import type { Info, Server, Spec } from '../../../types'
import { Card, CardContent, CardFooter, CardHeader } from '../../Card'
import {
  Section,
  SectionColumn,
  SectionColumns,
  SectionContainer,
  SectionContent,
  SectionHeader,
} from '../../Section'
import { Authentication } from '../Authentication'
import ClientSelector from './ClientSelector.vue'
import Description from './Description.vue'
import DownloadSpec from './DownloadSpec.vue'
import ServerList from './ServerList.vue'

const props = defineProps<{
  info: Info
  servers: Server[]
  parsedSpec: Spec
  rawSpec: string
}>()

const { state, getClientTitle, getTargetTitle } = useTemplateStore()

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
            <span
              v-if="info.version"
              class="section-version">
              {{ info.version }}
            </span>
            <span
              v-if="specVersion"
              class="section-oas">
              OAS {{ specVersion }}
            </span>
            <SectionHeader
              :level="1"
              :loading="!info.title"
              tight>
              {{ info.title }}
            </SectionHeader>
            <DownloadSpec :value="rawSpec" />
            <Description :value="info.description" />
          </SectionColumn>
          <SectionColumn>
            <div class="sticky-cards flex-col gap-1">
              <ServerList :value="servers" />

              <Card>
                <CardHeader transparent>Client Libraries</CardHeader>
                <CardContent
                  frameless
                  transparent>
                  <ClientSelector />
                </CardContent>
                <CardFooter
                  class="font-mono card-footer"
                  muted>
                  {{ getTargetTitle(state.selectedClient) }}
                  {{ getClientTitle(state.selectedClient) }}
                </CardFooter>
              </Card>

              <Authentication :parsedSpec="parsedSpec" />
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

.font-mono {
  color: var(--theme-color-1, var(--default-theme-color-1));
  font-size: var(--theme-small, var(--default-theme-small));
  font-family: var(--theme-font-code, var(--default-theme-font-code));
  padding: 10px 12px;
}
.sticky-cards {
  position: sticky;
  top: 24px;
}
.section-version,
.section-oas {
  color: var(--theme-color-2, var(--default-theme-color-2));
  font-size: var(--theme-micro, var(--default-theme-micro));
  background: var(--theme-background-2, var(--default-theme-background-2));
  padding: 2px 6px;
  border-radius: 12px;
  margin-right: 4px;
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
  margin-bottom: 3px;
  display: inline-block;
}
</style>
