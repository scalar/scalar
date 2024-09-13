<script setup lang="ts">
import type { ROUTES } from '@/constants'
import { useWorkspace } from '@/store/workspace'
import { ScalarIcon } from '@scalar/components'
import { useRouter } from 'vue-router'

type IconProps = InstanceType<typeof ScalarIcon>['$props']

defineProps<{
  icon: IconProps['icon']
  name: (typeof ROUTES)[number]['name']
  active?: boolean
}>()

const { activeWorkspace } = useWorkspace()

const { currentRoute } = useRouter()
</script>
<template>
  <router-link
    activeClass="active-link"
    class="flex flex-col items-center gap-0.5 group no-underline"
    :to="`/workspace/${activeWorkspace.uid}/${name}/default`">
    <div
      class="min-w-[28px] max-w-[28px] group-hover:bg-b-3 active:text-c-1 flex items-center justify-center rounded-lg p-1.25 scalar-app-nav-padding text-c-3"
      :class="{
        'bg-b-3 transition-none group-hover:cursor-auto !text-c-1': active,
      }">
      <ScalarIcon
        :icon="icon"
        thickness="1.5" />
      <!-- <div class="no-underline uppercase whitespace-nowrap">
        {{ prettyName }}
      </div> -->
    </div>
    <span class="sr-only"><slot /></span>
  </router-link>
</template>
