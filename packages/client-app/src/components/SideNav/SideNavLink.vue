<script setup lang="ts">
import { ScalarIcon } from '@scalar/components'

type IconProps = InstanceType<typeof ScalarIcon>['$props']

defineProps<{
  icon: IconProps['icon']
  path: string
  active?: boolean
}>()
</script>
<template>
  <router-link
    activeClass="active-link"
    class="w-[37px] hover:text-c-1 flex items-center justify-center rounded-lg p-2"
    :class="{ 'bg-b-2 transition-none hover:cursor-auto text-c-1': active }"
    :to="path">
    <ScalarIcon
      class="stroke-[0.75]"
      :icon="icon" />
    <span class="sr-only"><slot /></span>
  </router-link>
</template>
