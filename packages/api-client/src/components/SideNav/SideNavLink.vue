<script setup lang="ts">
import type { ROUTES } from '@/constants'
import { useWorkspace } from '@/store/workspace'
import { ScalarIcon } from '@scalar/components'

type IconProps = InstanceType<typeof ScalarIcon>['$props']

const props = defineProps<{
  icon: IconProps['icon']
  name: (typeof ROUTES)[number]['name']
  prettyName: (typeof ROUTES)[number]['prettyName']
  active?: boolean
}>()

const { activeWorkspace, activeCollection } = useWorkspace()

const getLink = () =>
  `/workspace/${activeWorkspace.value.uid}${props.name === 'request' ? `/collection/${activeCollection.value?.uid ?? 'default'}/request` : `/${props.name}`}/default`
</script>
<template>
  <router-link
    activeClass="active-link"
    class="flex flex-col items-center gap-1 group no-underline"
    :to="getLink()">
    <div
      class="min-w-[37px] max-w-[42px] group-hover:bg-b-2 active:text-c-1 flex items-center justify-center rounded-lg p-[7px] scalar-app-nav-padding"
      :class="{
        'bg-b-2 transition-none group-hover:cursor-auto text-c-1': active,
      }">
      <ScalarIcon
        :icon="icon"
        thickness="1.5" />
    </div>
    <div
      class="no-underline font-medium text-[11px] hidden scalar-app-show capitalize">
      {{ prettyName }}
    </div>
    <span class="sr-only"><slot /></span>
  </router-link>
</template>
