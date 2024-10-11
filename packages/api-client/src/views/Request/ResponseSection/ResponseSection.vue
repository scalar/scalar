<script setup lang="ts">
import ContextBar from '@/components/ContextBar.vue'
import ViewLayoutSection from '@/components/ViewLayout/ViewLayoutSection.vue'
import ResponseBody from '@/views/Request/ResponseSection/ResponseBody.vue'
import ResponseEmpty from '@/views/Request/ResponseSection/ResponseEmpty.vue'
import ResponseLoadingOverlay from '@/views/Request/ResponseSection/ResponseLoadingOverlay.vue'
import ResponseMetaInformation from '@/views/Request/ResponseSection/ResponseMetaInformation.vue'
import { ScalarIcon } from '@scalar/components'
import type { ResponseInstance } from '@scalar/oas-utils/entities/spec'
import { computed, ref } from 'vue'

import ResponseBodyVirtual from './ResponseBodyVirtual.vue'
import ResponseCookies from './ResponseCookies.vue'
import ResponseHeaders from './ResponseHeaders.vue'

const props = defineProps<{
  response: ResponseInstance | undefined
}>()

// Headers
const responseHeaders = computed(() => {
  const headers = props.response?.headers

  return headers
    ? Object.keys(headers)
        .map((key) => ({
          name: key,
          value: headers[key],
          required: false,
        }))
        .filter(
          (item) =>
            ![
              'rest-api-client-content-length',
              'X-API-Client-Content-Length',
            ].includes(item.name),
        )
    : []
})

// Cookies
const responseCookies = computed(
  () =>
    props.response?.cookieHeaderKeys.flatMap((key) => {
      const value = props.response?.headers?.[key]

      return value
        ? {
            name: key,
            value,
            required: false,
          }
        : []
    }) ?? [],
)

const sections = ['All', 'Cookies', 'Headers', 'Body']
type ActiveSections = (typeof sections)[number]
const activeSection = ref<ActiveSections>('All')

/** Threshold for virtualizing text responses */
const VIRTUALIZATION_THRESHOLD = 100
const shouldVirtualize = computed(
  () =>
    typeof props.response?.data === 'string' &&
    props.response.data.length > VIRTUALIZATION_THRESHOLD,
)
</script>
<template>
  <ViewLayoutSection>
    <template #title>
      <ScalarIcon
        class="text-c-3 mr-2 rotate-180"
        icon="ExternalLink"
        size="sm"
        thickness="2.5" />
      <div class="flex items-center flex-1">
        Response
        <ResponseMetaInformation
          v-if="response"
          :response="response" />
        <ContextBar
          :activeSection="activeSection"
          :sections="sections"
          @setActiveSection="activeSection = $event" />
      </div>
    </template>
    <div
      class="custom-scroll relative flex flex-1 flex-col px-2 xl:px-4 py-2.5">
      <template v-if="!response">
        <ResponseEmpty />
      </template>
      <template v-else>
        <ResponseCookies
          v-if="activeSection === 'All' || activeSection === 'Cookies'"
          :cookies="responseCookies" />
        <ResponseHeaders
          v-if="activeSection === 'All' || activeSection === 'Headers'"
          :headers="responseHeaders" />

        <template v-if="activeSection === 'All' || activeSection === 'Body'">
          <!-- Virtualized Text for massive responses -->
          <ResponseBodyVirtual
            v-if="shouldVirtualize"
            :content="props.response!.data as string" />

          <ResponseBody
            v-else
            :active="true"
            :data="props.response?.data"
            :headers="responseHeaders"
            title="Body" />
        </template>
      </template>
      <ResponseLoadingOverlay />
    </div>
  </ViewLayoutSection>
</template>
