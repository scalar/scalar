<script lang="ts" setup>
import { isJsonString, prettyPrintJson } from '../../helpers'
import { Section, SectionContainer, SectionContent } from '../Section'

defineProps<{
  value: string
}>()

/* Generate a download URL for the spec */
function inlineDownloadUrl(spec: string) {
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
function getFilename(spec: string) {
  return isJsonString(spec) ? 'spec.json' : 'spec.yaml'
}
</script>
<template>
  <SectionContainer>
    <Section>
      <SectionContent>
        <div class="download">
          <div class="download-cta">
            <a
              :download="getFilename(value)"
              :href="inlineDownloadUrl(value)">
              Download
            </a>
          </div>
        </div>
      </SectionContent>
    </Section>
  </SectionContainer>
</template>

<style scoped></style>
