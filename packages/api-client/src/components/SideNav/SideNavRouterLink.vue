<script setup lang="ts">
import SideNavLink from '@/components/SideNav/SideNavLink.vue'
import type { ROUTES } from '@/constants'
import { useWorkspace } from '@/store'
import type { Icon } from '@scalar/components'
import { RouterLink } from 'vue-router'

defineProps<{
  icon: Icon
  name: (typeof ROUTES)[number]['name']
  active?: boolean
}>()

const { activeWorkspace } = useWorkspace()
</script>
<template>
  <SideNavLink
    :is="RouterLink"
    :active="active"
    :icon="icon"
    :to="`/workspace/${activeWorkspace.uid}/${name}`">
    <slot />
  </SideNavLink>
</template>
