<script setup lang="ts">
// import FlowIcon from '@lib/components/FlowIcon.vue'
import FlowProgressRing from './FlowProgressRing.vue'
import type { CustomToast, Toast } from './FlowToast'
import FlowToastLayout from './FlowToastLayout.vue'

defineProps<{
  toast: Toast
}>()

const isCustom = (t: Toast): t is CustomToast => {
  return (t as CustomToast).component !== undefined
}
</script>
<template>
  <div class="toast">
    <Component
      :is="toast.component"
      v-if="isCustom(toast)">
      <template
        v-if="toast.options?.timeout"
        #timeout>
        <FlowProgressRing :duration="toast.options.timeout" />
      </template>
    </Component>
    <FlowToastLayout
      v-if="!isCustom(toast)"
      :status="toast.status">
      <!-- <template
        v-if="toast.icon"
        #icon>
        <FlowIcon :icon="toast.icon" />
      </template> -->
      <template #title>
        {{ toast.title }}
      </template>
      <template
        v-if="toast.description"
        #description>
        <template v-if="typeof toast.description === 'string'">
          {{ toast.description }}
        </template>
        <Component
          :is="toast.description"
          v-else />
      </template>
      <template
        v-if="toast.options?.timeout"
        #timeout>
        <FlowProgressRing :duration="toast.options.timeout" />
      </template>
    </FlowToastLayout>
  </div>
</template>

<style scoped>
.toast {
  pointer-events: initial;
  filter: brightness(var(--theme-lifted-brightness));

  background: var(--theme-background-1);
  border-radius: var(--theme-radius-lg);
  box-shadow: var(--theme-shadow-2);

  width: 380px;
}
</style>
