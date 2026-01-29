<script setup lang="ts">
import { ScalarErrorBoundary } from '@scalar/components'
import { isDefined } from '@scalar/helpers/array/is-defined'
import type { ResponseInstance } from '@scalar/oas-utils/entities/spec'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { computed, ref, useId } from 'vue'

import SectionFilter from '@/components/SectionFilter.vue'
import ViewLayoutSection from '@/components/ViewLayout/ViewLayoutSection.vue'
import type { ClientLayout } from '@/hooks'
import Headers from '@/v2/blocks/response-block/components/Headers.vue'
import ResponseBody from '@/v2/blocks/response-block/components/ResponseBody.vue'
import ResponseBodyStreaming from '@/v2/blocks/response-block/components/ResponseBodyStreaming.vue'
import ResponseBodyVirtual from '@/v2/blocks/response-block/components/ResponseBodyVirtual.vue'
import ResponseCookies from '@/v2/blocks/response-block/components/ResponseCookies.vue'
import ResponseEmpty from '@/v2/blocks/response-block/components/ResponseEmpty.vue'
import ResponseLoadingOverlay from '@/v2/blocks/response-block/components/ResponseLoadingOverlay.vue'
import ResponseMetaInformation from '@/v2/blocks/response-block/components/ResponseMetaInformation.vue'
import { textMediaTypes } from '@/v2/blocks/response-block/helpers/media-types'
import { parseSetCookie } from '@/v2/blocks/response-block/helpers/parse-set-cookie'
import type { ClientPlugin } from '@/v2/helpers/plugins'

const { layout, totalPerformedRequests, response, request } = defineProps<{
  /** Preprocessed response */
  response: ResponseInstance | null
  /** Original request instance */
  request: Request | null
  /** Client layout */
  layout: ClientLayout
  /** Total number of performed requests */
  totalPerformedRequests: number
  /** Application version */
  appVersion: string
  /** Registered app plugins */
  plugins: ClientPlugin[]
  /** Workspace event bus */
  eventBus: WorkspaceEventBus
}>()

// Headers
const responseHeaders = computed(() => {
  const headers = response?.headers

  return headers
    ? Object.keys(headers).map((key) => ({
        name: key,
        value: headers[key] ?? '',
      }))
    : []
})

// Cookies
const responseCookies = computed(
  () =>
    response?.cookieHeaderKeys
      .map((setCookieValue) => parseSetCookie(setCookieValue))
      .filter(isDefined) ?? [],
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
  if (!response || !('size' in response)) {
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

  // Check if content type matches any text-based type
  const isTextBased = textMediaTypes.some((type) => contentType.includes(type))

  return isTextBased && (response.size ?? 0) > VIRTUALIZATION_THRESHOLD
})

const requestHeaders = computed(() =>
  request?.headers
    ? [...request.headers].map((header) => ({
        name: header[0],
        value: header[1],
        required: false,
      }))
    : [],
)

const isSectionVisible = (
  section: (typeof responseSections)[number] | 'All',
) => {
  if (activeFilter.value === 'All' || activeFilter.value === section) {
    return true
  }
  return false
}

defineExpose({
  responseHeaders,
  responseCookies,
  requestHeaders,
  shouldVirtualize,
  activeFilter,
  filters,
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
            :eventBus="eventBus"
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
      class="custom-scroll response-section-content relative grid h-full justify-stretch"
      :class="{
        'content-start': response,
      }"
      :role="activeFilter === 'All' && response ? 'tabpanel' : 'none'">
      <template v-if="!response">
        <ResponseEmpty
          :appVersion="appVersion"
          :layout="layout"
          :totalPerformedRequests="totalPerformedRequests"
          @addRequest="
            eventBus.emit('ui:open:command-palette', {
              action: 'create-request',
              payload: undefined,
            })
          "
          @openCommandPalette="eventBus.emit('ui:open:command-palette')"
          @sendRequest="eventBus.emit('operation:send:request:hotkey')" />
      </template>
      <template v-else>
        <!-- Cookies section -->
        <ResponseCookies
          v-if="isSectionVisible('Cookies')"
          :id="filterIds.Cookies"
          class="response-section-content-cookies"
          :cookies="responseCookies"
          :role="activeFilter === 'All' ? 'none' : 'tabpanel'" />
        <!-- Request headers section -->
        <Headers
          v-if="isSectionVisible('Headers')"
          :id="filterIds.Headers"
          class="response-section-content-headers"
          :headers="requestHeaders"
          :role="activeFilter === 'All' ? 'none' : 'tabpanel'">
          <template #title>Request Headers</template>
        </Headers>
        <!-- Response headers section -->
        <Headers
          v-if="isSectionVisible('Headers')"
          :id="filterIds.Headers"
          class="response-section-content-headers"
          :headers="responseHeaders"
          :role="activeFilter === 'All' ? 'none' : 'tabpanel'">
          <template #title>Response Headers</template>
        </Headers>

        <ScalarErrorBoundary
          v-for="(plugin, index) in plugins"
          :key="index">
          <component
            :is="plugin.components.response"
            v-if="plugin.components?.response && request && response"
            v-show="activeFilter === 'All'"
            :request="request"
            :response="response" />
        </ScalarErrorBoundary>
        <template v-if="activeFilter === 'All' || activeFilter === 'Body'">
          <!-- Streaming response body -->
          <ResponseBodyStreaming
            v-if="'reader' in response"
            :id="filterIds.Body"
            class="response-section-content-body"
            :reader="response.reader" />

          <!-- Virtualized Text for massive responses -->
          <ResponseBodyVirtual
            v-else-if="shouldVirtualize && typeof response?.data === 'string'"
            :id="filterIds.Body"
            :content="response!.data"
            :data="response?.data"
            :headers="responseHeaders"
            :role="activeFilter === 'All' ? 'none' : 'tabpanel'" />

          <!-- Regular response body -->
          <ResponseBody
            v-else
            :id="filterIds.Body"
            :active="true"
            class="response-section-content-body"
            :data="response?.data"
            :headers="responseHeaders"
            layout="client"
            :role="activeFilter === 'All' ? 'none' : 'tabpanel'"
            title="Body" />
        </template>
      </template>
      <ResponseLoadingOverlay :eventBus="eventBus" />
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
