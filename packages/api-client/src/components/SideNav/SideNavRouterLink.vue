<script setup lang="ts">
import type { Icon } from '@scalar/components'
import { RouterLink, type RouteLocationRaw } from 'vue-router'

import SideNavLink from '@/components/SideNav/SideNavLink.vue'

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
