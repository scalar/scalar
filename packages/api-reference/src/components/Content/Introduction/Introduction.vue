<script setup lang="ts">
import { useTemplateStore } from '../../../stores/template'
import type { Info, Server } from '../../../types'
import { Card, CardContent, CardFooter, CardHeader } from '../../Card'
import {
  Section,
  SectionColumn,
  SectionColumns,
  SectionContainer,
  SectionContent,
  SectionHeader,
} from '../../Section'
import MarkdownRenderer from '../MarkdownRenderer.vue'
import BaseUrl from './BaseUrl.vue'
import ClientSelector from './ClientSelector.vue'

defineProps<{
  info: Info
  servers: Server[]
}>()

const { state, getClientTitle, getTargetTitle } = useTemplateStore()
</script>

<template>
  <SectionContainer>
    <Section>
      <SectionHeader
        :loading="!info.title"
        tight>
        {{ info.title }}
      </SectionHeader>
      <SectionContent :loading="!info.description">
        <SectionColumns>
          <SectionColumn>
            <MarkdownRenderer :value="info.description" />
          </SectionColumn>
          <SectionColumn>
            <div class="flex-col gap-1">
              <Card v-if="servers.length > 0">
                <CardHeader muted>
                  Base URL{{ servers?.length > 1 ? 's' : '' }}
                </CardHeader>
                <CardContent
                  v-for="server in servers"
                  :key="server.url"
                  muted>
                  <BaseUrl :server="server" />
                </CardContent>
              </Card>

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
.tag-description .loading {
  height: 20px;
  margin-bottom: 4px;
  width: 100%;
  display: inline-block;
}
.tag-description .loading:first-of-type {
  margin-top: 12px;
}
.tag-description .loading:last-of-type {
  width: 40%;
}

.font-mono {
  color: var(--theme-color-1, var(--default-theme-color-1));
  font-size: var(--theme-small, var(--default-theme-small));
  font-family: var(--theme-font-code, var(--default-theme-font-code));
  padding: 10px 12px;
}
</style>
