<script setup lang="ts">
import ContextBar from '@/components/ContextBar.vue'
import ViewLayoutSection from '@/components/ViewLayout/ViewLayoutSection.vue'
import ResponseBody from '@/views/Request/ResponseSection/ResponseBody.vue'
import ResponseEmpty from '@/views/Request/ResponseSection/ResponseEmpty.vue'
import ResponseLoadingOverlay from '@/views/Request/ResponseSection/ResponseLoadingOverlay.vue'
import ResponseMetaInformation from '@/views/Request/ResponseSection/ResponseMetaInformation.vue'
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
          value: headers[key] ?? '',
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

/** Threshold for virtualizing response bodies in bytes */
const VIRTUALIZATION_THRESHOLD = 200_000
const shouldVirtualize = computed(() => {
  if (!props.response) return false

  // Get content type from headers
  const contentType =
    props.response.headers?.['content-type'] ||
    props.response.headers?.['Content-Type']

  // If no content type or response size is small, don't virtualize
  if (!contentType || (props.response.size ?? 0) <= VIRTUALIZATION_THRESHOLD) {
    return false
  }

  // Common text-based content types
  const textBasedTypes = [
    // Text types
    'text/',
    // JSON types
    'application/json',
    'application/ld+json',
    'application/problem+json',
    'application/vnd.api+json',
    // XML types
    'application/xml',
    'application/atom+xml',
    'application/rss+xml',
    'application/problem+xml',
    // Other structured text
    'application/javascript',
    'application/ecmascript',
    'application/x-yaml',
    'application/yaml',
    // Source code
    'application/x-httpd-php',
    'application/x-sh',
    'application/x-perl',
    'application/x-python',
    'application/x-ruby',
    'application/x-java-source',
    // Form data
    'application/x-www-form-urlencoded',
  ]

  // Check if content type matches any text-based type
  const isTextBased = textBasedTypes.some((type) => contentType.includes(type))

  return isTextBased && (props.response.size ?? 0) > VIRTUALIZATION_THRESHOLD
})
</script>
<template>
  <ViewLayoutSection aria-label="Response">
    <template #title>
      <div class="flex items-center flex-1 h-8">
        <div
          aria-live="polite"
          class="flex items-center"
          :class="{ 'animate-response-heading': response }">
          <span class="response-heading absolute pointer-events-none">
            Response
          </span>
          <ResponseMetaInformation
            v-if="response"
            class="animate-response-children"
            :response="response" />
        </div>
        <ContextBar
          :activeSection="activeSection"
          :sections="sections"
          @setActiveSection="activeSection = $event" />
      </div>
    </template>
    <div
      class="custom-scroll h-full relative grid justify-stretch"
      :class="{
        'content-start': response,
      }">
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
            v-if="shouldVirtualize && typeof props.response?.data === 'string'"
            :content="props.response!.data"
            :data="props.response?.data"
            :headers="responseHeaders" />

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
<style scoped>
.animate-response-heading .response-heading {
  animation: push-response 0.2s ease-in-out forwards;
  opacity: 1;
}
@keyframes push-response {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-4px);
  }
}
.animate-response-heading .animate-response-children {
  animation: response-spans 0.2s ease-in-out forwards 0.05s;
  opacity: 0;
}

@keyframes response-spans {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
