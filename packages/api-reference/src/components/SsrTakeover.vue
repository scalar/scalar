<script setup lang="ts">
import type { AnyApiReferenceConfiguration } from '@scalar/types/api-reference'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import ApiReference from '@/components/ApiReference.vue'

/**
 * Server-side rendering takeover wrapper.
 *
 * Full server-rendered content is required for SEO, but the client cannot rebuild the
 * document synchronously (parsing and bundling are async), so a normal hydration would
 * replace the server content with a loading skeleton and trip Vue's hydration mismatch
 * guard. See https://github.com/scalar/scalar/issues/4458.
 *
 * Instead we hydrate the server markup as an OPAQUE `v-html` node. Vue does not
 * hydrate-compare the children of a `v-html` element, so hydration is always clean —
 * with no serialized state in the response and no re-parsing on the hydration path.
 * After mounting we boot the real, interactive `ApiReference` in the background and
 * reveal it once its document has loaded, so the server content never flashes.
 *
 * On the server (and for plain client-side mounts) `ssrHtml` is null and we render the
 * live reference directly.
 *
 * TODO(ssr): the reveal currently keeps the live tree hidden with `display: none` while
 * it loads, so above-the-fold operations only fill in after the swap. A follow-up can
 * overlay it (kept in layout, `visibility: hidden`) so it pre-warms before we reveal.
 */
const { configuration, ssrHtml = null } = defineProps<{
  configuration: AnyApiReferenceConfiguration
  /**
   * The exact inner HTML the server rendered, captured from the mount point before
   * hydration. Null on the server and for non-hydrating client mounts.
   */
  ssrHtml?: string | null
}>()

/** True once we are past hydration and may render the live tree. */
const mounted = ref(false)

/**
 * Only the client's first (hydration) render reuses the server HTML verbatim. On the
 * server and after we have taken over we render the live reference instead.
 */
const showFrozenOnly = computed(() => !mounted.value && ssrHtml !== null)

/** True once the live reference is ready to show (immediately when we are not hydrating). */
const revealed = ref(ssrHtml === null)

/** Safety net so a missing `onLoaded` can never strand us on the frozen snapshot. */
const REVEAL_FALLBACK_MS = 1500
let fallbackTimer: ReturnType<typeof setTimeout> | undefined

const reveal = () => {
  revealed.value = true
  if (fallbackTimer) {
    clearTimeout(fallbackTimer)
    fallbackTimer = undefined
  }
}

/**
 * Reveal the live tree as soon as its document has loaded. We chain the user's own
 * `onLoaded` so wrapping stays transparent.
 */
const withReveal = (config: unknown): unknown => {
  if (!config || typeof config !== 'object') {
    return config
  }

  const original = (config as { onLoaded?: (...args: unknown[]) => void })
    .onLoaded

  return {
    ...(config as Record<string, unknown>),
    onLoaded: (...args: unknown[]) => {
      original?.(...args)
      reveal()
    },
  }
}

const liveConfiguration = computed<AnyApiReferenceConfiguration>(() =>
  Array.isArray(configuration)
    ? (configuration.map(withReveal) as AnyApiReferenceConfiguration)
    : (withReveal(configuration) as AnyApiReferenceConfiguration),
)

onMounted(() => {
  mounted.value = true

  if (!revealed.value) {
    fallbackTimer = setTimeout(reveal, REVEAL_FALLBACK_MS)
  }
})

onBeforeUnmount(() => {
  if (fallbackTimer) {
    clearTimeout(fallbackTimer)
  }
})
</script>

<template>
  <!--
    During hydration the root reuses the server HTML verbatim via v-html, which Vue
    treats as opaque, so hydration never mismatches. The v-if/v-else keep the two roots
    as the same element so hydration lines up.
  -->
  <div
    v-if="showFrozenOnly"
    class="scalar-ssr-takeover"
    v-html="ssrHtml ?? ''" />
  <div
    v-else
    class="scalar-ssr-takeover">
    <!-- Frozen server content, shown until the live reference has loaded. -->
    <div
      v-if="!revealed && ssrHtml !== null"
      aria-hidden="true"
      class="scalar-ssr-frozen"
      v-html="ssrHtml" />
    <!-- The real, interactive reference. Hidden while it loads so nothing flashes. -->
    <ApiReference
      v-show="revealed"
      :configuration="liveConfiguration" />
  </div>
</template>
