<script lang="ts" setup>
import { useRouter } from 'vue-router'

defineProps<{
  route: Parameters<typeof router.resolve>[0]
}>()

const router = useRouter()
</script>

<template>
  <section
    :data-id="$router.resolve(route).path"
    style="scroll-margin-top: 100px">
    <slot />
  </section>
</template>
