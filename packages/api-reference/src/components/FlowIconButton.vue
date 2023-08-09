<script setup lang="ts">
import FlowButton, { type ButtonVariant } from './FlowButton.vue'
import { FlowIcon } from './Icon'
import { type Icon } from './Icon/icons'

withDefaults(
  defineProps<{
    label: string
    icon: Icon
    variant?: ButtonVariant
  }>(),
  {
    variant: 'clear',
  },
)
</script>
<template>
  <FlowButton
    class="icon-button"
    icon
    :label="label"
    :variant="variant">
    <FlowIcon :icon="icon" />
  </FlowButton>
</template>
