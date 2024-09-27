<script setup lang="ts">
import { ScalarIcon } from '@scalar/components'

defineProps<{
  activeUser?: {
    displayName: string
    imageUri?: string
  }
}>()
</script>
<template>
  <button
    aria-label="Workspace Menu"
    class="workspace-avatar shine-effect"
    type="button">
    <img
      v-if="activeUser?.imageUri"
      class="workspace-avatar-image"
      :src="activeUser.imageUri" />
    <template v-else-if="activeUser?.displayName && activeUser?.displayName[0]">
      <span>{{ activeUser?.displayName[0] }}</span>
    </template>
    <template v-else>
      <ScalarIcon
        class="text-c-1 h-6 w-6"
        icon="Logo" />
    </template>
  </button>
</template>
<style>
.workspace-avatar {
  align-items: center;
  background: var(--scalar-background-1);
  border: 1px solid var(--scalar-border-color);
  border-radius: 8px;
  display: flex;
  justify-content: center;
  transition: border 0.2s;
  aspect-ratio: 1;
  width: 100%;
  min-height: 37px;
  max-width: 37px;
}
.dark-mode .workspace-avatar {
  --gradient-color-1: color-mix(
    in srgb,
    var(--scalar-brand) 30%,
    var(--scalar-background-1)
  );
  --gradient-color-2: color-mix(
    in srgb,
    var(--scalar-brand) 20%,
    var(--scalar-background-1)
  );
}
.workspace-avatar:hover {
  border: 1px solid #00000033;
}
.workspace-avatar-image {
  inset: 0;
  position: absolute;
  aspect-ratio: 1 / 1;
  background-size: cover;
  background-position: center;
  z-index: 1;
}
.shine-effect {
  overflow: hidden;
  position: relative;
}
.shine-effect:before {
  background-color: rgba(255, 255, 255, 0.2);
  content: '';
  filter: blur(2px);
  height: 150%;
  left: -100%;
  position: absolute;
  transform: rotate(30deg);
  width: 16px;
}
.dark-mode .shine-effect:before {
  background-color: rgba(0, 0, 0, 0.2);
  content: '';
  filter: blur(2px);
  height: 150%;
  left: -100%;
  position: absolute;
  transform: rotate(30deg);
  width: 16px;
}
.shine-effect:hover:before {
  left: 100%;
  transition: left 1s ease;
}
</style>
