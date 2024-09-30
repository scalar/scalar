<script lang="ts" setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import Placeholder from '../../components/Placeholder.vue'

const props = defineProps<{
  params?: {
    tag: string
  }
}>()

const router = useRouter()

const currentParams = computed(() => {
  return props.params ?? router.currentRoute.value.params
})
</script>
<template>
  <div class="p-1">
    <Placeholder style="height: 1200px">
      [Tag] {{ currentParams }}
    </Placeholder>
  </div>
</template>
