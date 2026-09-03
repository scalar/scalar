<script setup lang="ts">
import prettyMilliseconds from 'pretty-ms'
import { computed } from 'vue'

import type { RequestTiming } from '@/v2/blocks/response-block/helpers/parse-server-timing'
import { CollapsibleSection } from '@/v2/components/layout'

const { timing } = defineProps<{
  timing: RequestTiming
}>()

/**
 * Human-readable labels and colors for the known proxy phases. Unknown phase
 * names fall back to their raw name and a neutral color, so new metrics from
 * the proxy still render without a code change.
 */
const PHASE_META: Record<string, { label: string; color: string }> = {
  dns: { label: 'DNS Lookup', color: 'var(--scalar-color-purple)' },
  connect: { label: 'Initial Connection', color: 'var(--scalar-color-orange)' },
  tls: { label: 'TLS Handshake', color: 'var(--scalar-color-blue)' },
  ttfb: {
    label: 'Waiting for Server Response',
    color: 'var(--scalar-color-green)',
  },
}

/** The total measured time across all reported phases. */
const total = computed(() =>
  timing.phases.reduce((sum, phase) => sum + phase.duration, 0),
)

/**
 * Lay the phases out as a waterfall: each bar starts where the previous one
 * ended, so the segments read left to right like the browser dev tools.
 */
const segments = computed(() => {
  let offset = 0

  return timing.phases.map((phase) => {
    const meta = PHASE_META[phase.name] ?? {
      label: phase.name,
      color: 'var(--scalar-color-3)',
    }
    const widthPercent =
      total.value > 0 ? (phase.duration / total.value) * 100 : 0
    const offsetPercent = total.value > 0 ? (offset / total.value) * 100 : 0

    offset += phase.duration

    return {
      key: phase.name,
      label: meta.label,
      color: meta.color,
      duration: phase.duration,
      widthPercent,
      offsetPercent,
    }
  })
})

/** Format a millisecond value with the same helper used across the response UI. */
const format = (ms: number) =>
  prettyMilliseconds(ms, { millisecondsDecimalDigits: 2 })
</script>
<template>
  <CollapsibleSection
    class="overflow-auto"
    :itemCount="timing.phases.length">
    <template #title>Timing</template>
    <div class="bg-b-1 flex flex-col gap-2.5 border-t p-4 text-sm">
      <div
        v-for="segment in segments"
        :key="segment.key"
        class="grid grid-cols-[minmax(0,10rem)_1fr_auto] items-center gap-3">
        <span class="text-c-2 truncate">{{ segment.label }}</span>
        <!-- Waterfall track -->
        <div class="bg-b-2 relative h-2 min-w-16 rounded-full">
          <div
            class="absolute top-0 h-full min-w-0.5 rounded-full"
            :style="{
              left: `${segment.offsetPercent}%`,
              width: `${segment.widthPercent}%`,
              backgroundColor: segment.color,
            }" />
        </div>
        <span class="text-c-1 tabular-nums">{{
          format(segment.duration)
        }}</span>
      </div>

      <!-- Total -->
      <div
        class="text-c-1 mt-1 flex items-center justify-between border-t pt-2.5 font-medium">
        <span>Total</span>
        <span class="tabular-nums">{{ format(total) }}</span>
      </div>

      <p class="text-c-3 text-xs">
        <template v-if="timing.reused">
          Connection reused, so DNS, connection, and TLS were skipped.
        </template>
        Measured by the proxy between the proxy and the target server.
      </p>
    </div>
  </CollapsibleSection>
</template>
