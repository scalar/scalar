<script lang="ts" setup>
import { useRoute } from '#imports'

import type { Meta } from '../../types'

const route = useRoute()
const meta = route.meta as Meta

// Ensure we have a spec
if (
  !meta.isOpenApiEnabled &&
  !meta.configuration?.url &&
  !meta.configuration?.content &&
  // @ts-expect-error support the old syntax for a bit
  !meta.configuration?.spec?.url &&
  // @ts-expect-error support the old syntax for a bit
  !meta.configuration?.spec?.content
) {
  throw new Error(
    'You must either provide a spec to scalar, or enable experimental openApi in the Nitro config.',
  )
}
</script>

<template>
  <ScalarApiReference :configuration="meta.configuration" />
</template>
