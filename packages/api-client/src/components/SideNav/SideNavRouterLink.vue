<script setup lang="ts">
import SideNavLink from '@/components/SideNav/SideNavLink.vue'
import type { Icon } from '@scalar/components'
import { type RouteLocationRaw, RouterLink } from 'vue-router'

defineProps<{
  icon: Icon
  to: RouteLocationRaw
  active?: boolean
}>()
</script>
<template>
  <SideNavLink
    :is="RouterLink"
    :active="Boolean(active)"
    :icon="icon"
    :to="to">
    <slot />
  </SideNavLink>
</template>
