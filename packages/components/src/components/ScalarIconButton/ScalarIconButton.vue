<script setup lang="ts">
import { type ButtonProps, ScalarButton } from '../ScalarButton'
import { type Icon, ScalarIcon } from '../ScalarIcon'

withDefaults(
  defineProps<{
    label: string
    icon: Icon
    variant?: ButtonProps['variant']
  }>(),
  {
    variant: 'ghost',
  },
)
</script>

<template>
  <ScalarButton
    :title="label"
    :variant="variant">
    <template #icon>
      <ScalarIcon :name="icon" />
    </template>
  </ScalarButton>
</template>
