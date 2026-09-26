<script setup lang="ts">
import { useLocalization } from '@/v2/features/localization'

const { variant = 'default' } = defineProps<{
  /**
   * How the toggle is drawn.
   *
   * `default` is a flat button that sits inside a panel. `overlay` is the
   * circular treatment used when the toggle floats on the dimmed backdrop
   * outside the modal, where it mirrors the close button on the other side.
   */
  variant?: 'default' | 'overlay'
}>()

const { translate } = useLocalization()

const isSidebarOpen = defineModel<boolean>({
  required: true,
})
</script>
<template>
  <button
    :aria-pressed="isSidebarOpen"
    class="scalar-sidebar-toggle"
    :class="
      variant === 'overlay'
        ? 'scalar-sidebar-toggle--overlay rounded-full'
        : 'text-c-3 hover:bg-b-2 active:text-c-1 rounded p-2'
    "
    type="button"
    @click="isSidebarOpen = !isSidebarOpen">
    <span class="sr-only">{{
      isSidebarOpen
        ? translate('apiClient.sidebarToggle.hide')
        : translate('apiClient.sidebarToggle.show')
    }}</span>
    <svg
      class="size-4"
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="mask">
          <path
            clip-rule="evenodd"
            d="M9 3.2H4c-1.7 0-3 1.3-3 3v11.5c0 1.7 1.3 3 3 3h5V3.2z" />
        </clipPath>
      </defs>
      <g clip-path="url(#mask)">
        <path
          class="transition-transform duration-300"
          :class="isSidebarOpen ? 'translate-x-0' : '-translate-x-1/2'"
          d="M1 3.2h8v17.5H1z"
          fill="currentColor" />
      </g>
      <path
        d="M20 20.8H4c-1.7 0-3-1.3-3-3V6.2c0-1.7 1.3-3 3-3h16c1.7 0 3 1.3 3 3v11.5c0 1.7-1.3 3-3 3zM9 3.2v17.5"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2" />
    </svg>
  </button>
</template>

<style scoped>
/**
 * Matches the modal close button on the opposite corner, so the two controls
 * that sit on the backdrop read as a pair. The padding is set here rather than
 * with a utility class so the 36px circle matches that button even when this
 * component is consumed from a build that generates its own utilities.
 */
.scalar-sidebar-toggle--overlay {
  color: white;
  background: rgba(0, 0, 0, 0.1);
  padding: 10px;
}
.scalar-sidebar-toggle--overlay:hover {
  background: rgba(255, 255, 255, 0.1);
}
</style>
