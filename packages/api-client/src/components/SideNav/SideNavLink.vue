<script setup lang="ts">
import type { ROUTES } from '@/constants'
import { useWorkspace } from '@/store'
import { ScalarIcon } from '@scalar/components'

type IconProps = InstanceType<typeof ScalarIcon>['$props']

defineProps<{
  icon: IconProps['icon']
  name: (typeof ROUTES)[number]['name'] | 'settings'
  active?: boolean
}>()

const { activeWorkspace } = useWorkspace()
</script>
<template>
  <router-link
    activeClass="active-link"
    class="flex flex-col items-center gap-1 group no-underline"
    :to="`/workspace/${activeWorkspace.uid}/${name}`">
    <div
      class="min-w-[37px] max-w-[37px] group-hover:bg-b-3 active:text-c-1 flex items-center justify-center rounded-lg p-[8px] scalar-web-header-nav text-c-3"
      :class="{
        '!bg-b-3 transition-none group-hover:cursor-auto !text-c-1': active,
      }">
      <ScalarIcon
        class="scalar-web-header-nav-svg"
        :icon="icon"
        thickness="1.5" />
      <span class="sr-only scalar-web-header-nav-item"><slot /></span>
    </div>
    <!-- <div
      class="no-underline font-medium text-[11px] hidden scalar-app-show capitalize">
      {{ prettyName }}
    </div> -->
  </router-link>
</template>
