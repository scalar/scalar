<script setup lang="ts">
import type { InfoObject } from '@scalar/workspace-store/schemas/v3.1/strict/info'
import { computed } from 'vue'

import { Badge } from '@/components/Badge'

const { version } = defineProps<{
  version: InfoObject['version']
}>()

/** Format the version number to be displayed in the badge */
const prefixedVersion = computed(() => {
  // Prefix the version with “v” if the first character is a number, don't prefix if it's not.
  // Don't output anything when version is not a string.
  return typeof version === 'string'
    ? version.toString().match(/^\d/)
      ? `v${version}`
      : version
    : typeof version === 'number'
      ? `v${version}`
      : undefined
})
</script>
<template>
  <Badge v-if="prefixedVersion">{{ prefixedVersion }}</Badge>
</template>
