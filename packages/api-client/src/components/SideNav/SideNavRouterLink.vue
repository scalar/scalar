<script setup lang="ts">
import SideNavLink from '@/components/SideNav/SideNavLink.vue'
import type { ROUTES } from '@/constants'
import { useActiveEntities } from '@/store/active-entities'
import type { Icon } from '@scalar/components'
import { RouterLink } from 'vue-router'

defineProps<{
  icon: Icon
  name: (typeof ROUTES)[number]['name']
  active?: boolean
}>()

const { activeWorkspace } = useActiveEntities()
</script>
<template>
  <!-- Use named routes instead -->
  <SideNavLink
    :is="RouterLink"
    :active="active"
    :icon="icon"
    :to="`/workspace/${activeWorkspace?.uid}/${name}`">
    <slot />
  </SideNavLink>
</template>
