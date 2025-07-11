<script lang="ts" setup>
import { useBindCx } from '@scalar/use-hooks/useBindCx'

import ScalarCardSection from './ScalarCardSection.vue'

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <ScalarCardSection v-bind="cx('scalar-card-footer')">
    <slot />
  </ScalarCardSection>
</template>
