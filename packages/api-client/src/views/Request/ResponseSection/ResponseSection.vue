<script setup lang="ts">
import type { ResponseInstance } from '@scalar/oas-utils/entities/spec'
import { computed, ref, useId } from 'vue'

import SectionFilter from '@/components/SectionFilter.vue'
import ViewLayoutSection from '@/components/ViewLayout/ViewLayoutSection.vue'
import ResponseBody from '@/views/Request/ResponseSection/ResponseBody.vue'
import ResponseEmpty from '@/views/Request/ResponseSection/ResponseEmpty.vue'
import ResponseLoadingOverlay from '@/views/Request/ResponseSection/ResponseLoadingOverlay.vue'
import ResponseMetaInformation from '@/views/Request/ResponseSection/ResponseMetaInformation.vue'

import ResponseBodyVirtual from './ResponseBodyVirtual.vue'
import ResponseCookies from './ResponseCookies.vue'
import ResponseHeaders from './ResponseHeaders.vue'

const { numWorkspaceRequests, response } = defineProps<{
  numWorkspaceRequests: number
  response: ResponseInstance | undefined
}>()

// Headers
const responseHeaders = computed(() => {
  const headers = response?.headers

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
    response?.cookieHeaderKeys.flatMap((key) => {
      const value = response?.headers?.[key]

      return value
        ? {
            name: key,
            value,
            required: false,
          }
        : []
    }) ?? [],
)

const responseSections = ['Cookies', 'Headers', 'Body'] as const
type Filter = 'All' | (typeof responseSections)[number]
const activeFilter = ref<Filter>('All')

const filters = computed<Filter[]>(() => ['All', ...responseSections])

const filterIds = computed(
  () =>
    Object.fromEntries(
      filters.value.map((section) => [section, useId()]),
    ) as Record<Filter, string>,
)

/** Threshold for virtualizing response bodies in bytes */
const VIRTUALIZATION_THRESHOLD = 200_000
const shouldVirtualize = computed(() => {
  if (!response) {
    return false
  }

  // Get content type from headers
  const contentType =
    response.headers?.['content-type'] || response.headers?.['Content-Type']

  // If no content type or response size is small, don't virtualize
  if (!contentType || (response.size ?? 0) <= VIRTUALIZATION_THRESHOLD) {
    return false
  }

  // Do not virtualize html
  if (contentType.includes('text/html')) {
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

  return isTextBased && (response.size ?? 0) > VIRTUALIZATION_THRESHOLD
})
</script>
<template>
  <ViewLayoutSection aria-label="Response">
    <template #title>
      <div class="flex h-8 flex-1 items-center">
        <div
          aria-live="polite"
          class="flex items-center"
          :class="{ 'animate-response-heading': response }">
          <span class="response-heading pointer-events-none absolute">
            Response
          </span>
          <ResponseMetaInformation
            v-if="response"
            class="animate-response-children"
            :response="response" />
        </div>
        <SectionFilter
          v-model="activeFilter"
          :filterIds="filterIds"
          :filters="filters" />
      </div>
    </template>
    <div
      :id="filterIds.All"
      class="custom-scroll relative grid h-full justify-stretch divide-y"
      :class="{
        'content-start': response,
      }"
      :role="activeFilter === 'All' && response ? 'tabpanel' : 'none'">
      <template v-if="!response">
        <ResponseEmpty :numWorkspaceRequests="numWorkspaceRequests" />
      </template>
      <template v-else>
        <ResponseCookies
          v-if="activeFilter === 'All' || activeFilter === 'Cookies'"
          :id="filterIds.Cookies"
          :cookies="responseCookies"
          :role="activeFilter === 'All' ? 'none' : 'tabpanel'" />
        <ResponseHeaders
          v-if="activeFilter === 'All' || activeFilter === 'Headers'"
          :id="filterIds.Headers"
          :headers="responseHeaders"
          :role="activeFilter === 'All' ? 'none' : 'tabpanel'" />

        <template v-if="activeFilter === 'All' || activeFilter === 'Body'">
          <!-- Virtualized Text for massive responses -->
          <ResponseBodyVirtual
            v-if="shouldVirtualize && typeof response?.data === 'string'"
            :id="filterIds.Body"
            :content="response!.data"
            :data="response?.data"
            :headers="responseHeaders"
            :role="activeFilter === 'All' ? 'none' : 'tabpanel'" />

          <ResponseBody
            v-else
            :id="filterIds.Body"
            :active="true"
            :data="response?.data"
            :headers="responseHeaders"
            :role="activeFilter === 'All' ? 'none' : 'tabpanel'"
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
