<script setup lang="ts">
import type { ROUTE_NAMES } from '@/constants'
import { useWorkspace } from '@/store'
import { ScalarIcon } from '@scalar/components'

type IconProps = InstanceType<typeof ScalarIcon>['$props']

defineProps<{
  icon: IconProps['icon']
  name: (typeof ROUTE_NAMES)[number]['name']
  active?: boolean
}>()

const { activeWorkspace } = useWorkspace()
</script>
<template>
  <router-link
    activeClass="active-link"
    class="flex flex-col items-center gap-1 group no-underline"
    :to="`/workspace/${activeWorkspace.uid}/${name}/default`">
    <div
      class="min-w-[37px] max-w-[37px] group-hover:bg-b-2 active:text-c-1 flex items-center justify-center rounded-lg p-[7px] scalar-app-nav-padding text-c-3"
      :class="{
        'bg-b-2 transition-none group-hover:cursor-auto !text-c-1': active,
      }">
      <ScalarIcon
        :icon="icon"
        thickness="1.5" />
    </div>
    <!-- <div
      class="no-underline font-medium text-[11px] hidden scalar-app-show capitalize">
      {{ prettyName }}
    </div> -->
    <span class="sr-only"><slot /></span>
  </router-link>
</template>
