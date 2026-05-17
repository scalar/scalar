<script setup lang="ts">
import type { InfoObject } from '@scalar/types/openapi/3.1'
import { computed } from 'vue'

import { Badge } from '@/components/Badge'

const { version } = defineProps<{
  version: InfoObject['version']
}>()

/** Format the version number to be displayed in the badge */
const prefixedVersion = computed(() => {
  if (version == null) {
    return version
  }

  const versionString = String(version)

  // Prefix with "v" if the first character is a number
  return /^\d/.test(versionString) ? `v${versionString}` : versionString
})
</script>
<template>
  <Badge v-if="prefixedVersion">{{ prefixedVersion }}</Badge>
</template>
