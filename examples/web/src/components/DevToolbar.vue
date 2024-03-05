<script setup lang="ts">
import { ResetStyles } from '@scalar/themes'
import { ref, watch } from 'vue'

const docStyle = document.documentElement.style

// Toggle the toolbar visibility
const showToolbar = ref(true)
watch(
  showToolbar,
  (show) => {
    if (show) {
      docStyle.setProperty('--theme-header-height', '40px')
    } else {
      docStyle.removeProperty('--theme-header-height')
    }
  },
  { immediate: true },
)
</script>
<template>
  <ResetStyles v-slot="{ styles }">
    <header
      v-if="showToolbar"
      class="dev-header"
      :class="styles">
      <div class="dev-title">
        Dev Toolbar
        <a
          class="dev-home-link"
          href="/"
          title="Back to homepage">
          &larr; Go back
        </a>
      </div>
      <div class="dev-options">
        <slot />
        <button
          class="dev-hide-toolbar"
          type="button"
          @click="showToolbar = false">
          Hide
        </button>
      </div>
    </header>
    <button
      v-else
      class="dev-show-toolbar"
      type="button"
      @click="showToolbar = true">
      Dev Toolbar
    </button>
  </ResetStyles>
</template>
<style scoped>
.dev-header {
  display: flex;
  justify-content: space-between;
  color: var(--default-theme-color-1);

  width: 100%;
  height: var(--theme-header-height);

  background: var(--default-theme-background-1);
  border-bottom: 1px solid var(--default-theme-border-color);
}
.dev-title {
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0px 8px;

  min-width: 0;
  flex: 1;

  white-space: nowrap;
  overflow: hidden;
}
.dev-home-link {
  font-weight: medium;
  font-size: smaller;
  text-decoration: none;

  padding: 4px 6px;
  border: 1px solid var(--default-theme-border-color);
  color: var(--default-theme-color-1);
  background: var(--default-theme-background-2);
  border-radius: var(--default-theme-radius);
}
.dev-home-link:hover {
  background: var(--default-theme-background-3);
}

.dev-options {
  display: flex;
  font-size: var(--default-theme-small);
}

.dev-options > :deep(*) {
  padding: 0px 12px;
  border-left: 1px solid var(--default-theme-border-color);
  display: flex;
  align-items: center;
  gap: 4px;
}

.dev-show-toolbar {
  position: fixed;
  z-index: 1000;
  top: 8px;
  right: 8px;

  padding: 4px 8px;

  font-size: var(--default-theme-small);
  font-weight: 500;

  color: var(--default-theme-color-1);
  background: var(--default-theme-background-1);
  border: 1px solid var(--default-theme-border-color);
  border-radius: var(--default-theme-radius);
  box-shadow: var(--default-theme-shadow-1);
}

.dev-show-toolbar:hover,
.dev-hide-toolbar:hover {
  background: var(--default-theme-background-2);
}
</style>
