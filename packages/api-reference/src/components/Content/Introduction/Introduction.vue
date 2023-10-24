<script setup lang="ts">
import { isJsonString, prettyPrintJson } from '../../../helpers'
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
import MarkdownRenderer from '../MarkdownRenderer.vue'
import BaseUrl from './BaseUrl.vue'
import ClientSelector from './ClientSelector.vue'

const props = defineProps<{
  info: Info
  servers: Server[]
  spec: Spec
}>()

const { state, getClientTitle, getTargetTitle } = useTemplateStore()

/* Generate a download URL for the spec */
function inlineDownloadUrl() {
  const spec = JSON.stringify(props.spec)
  const blob = isJsonString(spec)
    ? new Blob([prettyPrintJson(spec)], {
        type: 'application/json',
      })
    : new Blob([spec], {
        type: 'application/x-yaml',
      })

  return URL.createObjectURL(blob)
}

/* Generate a filename for the spec */
function getFilename() {
  const spec = JSON.stringify(props.spec)
  return isJsonString(spec) ? 'spec.json' : 'spec.yaml'
}

function getFilePath() {
  return `${window.location.origin}/${getFilename()}`
}
</script>

<template>
  <SectionContainer>
    <Section>
      <SectionContent :loading="!info.description && !info.title">
        <SectionColumns>
          <SectionColumn>
            <SectionHeader
              :level="1"
              :loading="!info.title"
              tight>
              {{ info.title }}
            </SectionHeader>
            <div class="download">
              <div class="download-cta">
                <a
                  :download="getFilename()"
                  :href="inlineDownloadUrl()">
                  {{ getFilePath() }}
                </a>
              </div>
            </div>
            <MarkdownRenderer :value="info.description" />
          </SectionColumn>
          <SectionColumn>
            <div class="sticky-cards flex-col gap-1">
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
              <Authentication :spec="spec" />
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
.download-cta {
  margin-bottom: 24px;
}
.download-cta a {
  color: var(--theme-color-accent, var(--default-theme-color-accent));
  text-decoration: none;
  font-size: var(--theme-paragraph, var(--default-theme-paragraph));
}
.download-cta a:hover {
  text-decoration: underline;
}
</style>
