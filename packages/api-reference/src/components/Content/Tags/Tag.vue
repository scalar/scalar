<script setup lang="ts">
import { computed } from 'vue'

import type { TraversedTag } from '@/features/traverse-schema'
import { useNavState } from '@/hooks/useNavState'

import ClassicLayout from './ClassicLayout.vue'
import ModernLayout from './ModernLayout.vue'

const { getTagId } = useNavState()

const { tag } = defineProps<{
  tag: TraversedTag
  layout: 'classic' | 'modern'
}>()

const tagId = computed(() => getTagId(tag.tag))
</script>

<template>
  <template v-if="layout === 'classic'">
    <ClassicLayout
      v-bind="$props"
      :id="tagId">
      <slot />
    </ClassicLayout>
  </template>
  <template v-else>
    <ModernLayout
      v-bind="$props"
      :id="tagId">
      <slot />
    </ModernLayout>
  </template>
</template>
