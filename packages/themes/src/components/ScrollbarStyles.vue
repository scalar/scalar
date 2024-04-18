<script setup lang="ts">
import { useCssModule } from 'vue'

import { useApplyClasses } from '../hooks/useApplyClasses'

const { scrollbars } = useCssModule()

// Add the reset to the headless UI root as well if there is one
useApplyClasses('#headlessui-portal-root', scrollbars)
</script>
<template>
  <slot :styles="scrollbars" />
</template>
<style lang="postcss" module>
/* Use :where to lower specificity to 0 */
:where(.scrollbars) :global {
  .cm-scroller,
  .custom-scroll {
    overflow-y: auto;
    scrollbar-color: transparent transparent;
    scrollbar-width: thin;
    -webkit-overflow-scrolling: touch;
  }
  .custom-scroll-self-contain-overflow {
    overscroll-behavior: contain;
  }
  @supports (-moz-appearance: none) {
    .cm-scroller,
    .custom-scroll {
      padding-right: 12px;
    }
  }
  .cm-scroller:hover,
  .custom-scroll:hover {
    scrollbar-color: var(--scalar-scrollbar-color) transparent;
  }
  .cm-scroller:hover::-webkit-scrollbar-thumb,
  .custom-scroll:hover::-webkit-scrollbar-thumb {
    background: var(--scalar-scrollbar-color);
    background-clip: content-box;
    border: 3px solid transparent;
  }
  .cm-scroller::-webkit-scrollbar-thumb:active,
  .custom-scroll::-webkit-scrollbar-thumb:active {
    background: var(--scalar-scrollbar-color-active);
    background-clip: content-box;
    border: 3px solid transparent;
  }
  .cm-scroller::-webkit-scrollbar-corner,
  .custom-scroll::-webkit-scrollbar-corner {
    background: transparent;
  }
  .cm-scroller::-webkit-scrollbar,
  .custom-scroll::-webkit-scrollbar {
    height: 12px;
    width: 12px;
  }
  .cm-scroller::-webkit-scrollbar-track,
  .custom-scroll::-webkit-scrollbar-track {
    background: transparent;
  }
  .cm-scroller::-webkit-scrollbar-thumb,
  .custom-scroll::-webkit-scrollbar-thumb {
    border-radius: 20px;
    background: transparent;
    background-clip: content-box;
    border: 3px solid transparent;
  }
  @media (pointer: coarse) {
    .cm-scroller,
    .custom-scroll {
      padding-right: 12px;
    }
  }
}
</style>
