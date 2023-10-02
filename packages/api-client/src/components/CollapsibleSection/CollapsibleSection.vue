<script lang="ts" setup>
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'

defineProps<{
  title?: string
}>()
</script>

<template>
  <Disclosure
    v-slot="{ open }"
    :defaultOpen="true">
    <div
      class="scalar-api-client__item"
      :class="{ 'scalar-api-client__item--open': open }">
      <DisclosureButton class="scalar-api-client__toggle">
        <svg
          class="scalar-api-client__toggle__icon"
          height="10"
          viewBox="0 0 5 10"
          width="5"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0 10l5-5-5-5z"
            fill="currentColor"
            fill-rule="nonzero" />
        </svg>
        <span class="scalar-api-client__item__title">
          {{ title }}
        </span>
        <div
          v-if="$slots.options && open"
          class="scalar-api-client__item__options">
          <slot name="options" />
        </div>
      </DisclosureButton>
      <DisclosurePanel>
        <div class="scalar-api-client__item__content">
          <slot />
        </div>
      </DisclosurePanel>
    </div>
  </Disclosure>
</template>

<style>
.scalar-api-client__item {
  border-radius: var(--theme-radius, var(--default-theme-radius));
  margin-bottom: 6px;
  background: var(--theme-background-2, var(--default-theme-background-2));
  position: relative;
}

.scalar-api-client__item button {
  background-color: transparent;
  text-align: left;
}

.scalar-api-client__item:hover {
  cursor: pointer;
}

.scalar-api-client__item--open {
  background: var(--theme-background-2, var(--default-theme-background-2));
}

.scalar-api-client__item--open:focus-within {
  box-shadow: var(--shadow1, var(--default-shadow1));
}

.scalar-api-client__item--open .scalar-api-client__item__content {
  display: flex;
}

.scalar-api-client__item--open:hover {
  cursor: default;
}

.scalar-api-client__item--open .scalar-api-client__toggle__icon {
  transform: rotate(90deg);
}
.scalar-api-client__toggle {
  padding: 6px 12px;
  min-height: 37px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  width: 100%;
  appearance: none;
  outline: 0;
  border: none;
  font-family: (--theme-font, var(--default-theme-font));
  cursor: pointer;
}

.scalar-api-client__item .scalar-api-client__item__title {
  color: var(--theme-color-1, var(--default-theme-color-1));
  font-size: var(--theme-small, var(--default-theme-small));
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
  font-family: (--theme-font, var(--default-theme-font));
  user-select: none;
  flex: 1;
  position: relative;
  z-index: 1;
}

.scalar-api-client__toggle:after {
  content: '';
  position: absolute;
  top: 6px;
  left: 6px;
  width: calc(100% - 12px);
  height: calc(100% - 12px);
  display: block;
  background: var(--default-theme-background-3);
  z-index: 0;
  opacity: 0;
  border-radius: var(--default-theme-radius);
}
.scalar-api-client__toggle:hover:after {
  opacity: 1;
}
.scalar-api-client__item .scalar-api-client__toggle__icon {
  width: 10px;
  margin-right: 6px;
  color: var(--theme-color-1, var(--default-theme-color-1));
  z-index: 1;
  position: relative;
}

.scalar-api-client__item__options {
  position: relative;
  z-index: 1;
}

.scalar-api-client__item__options span {
  background: var(--theme-background-3, var(--default-theme-background-3));
  padding: 2px 6px;
  border-radius: 3px;
  font-size: var(--theme-micro, var(--default-theme-micro));
  pointer-events: none;
  color: var(--theme-color-2, var(--default-theme-color-2));
  border: 1px solid var(--theme-border-color, var(--default-theme-border-color));
  display: flex;
  align-items: center;
  justify-content: center;
}

.scalar-api-client__item__options span svg {
  width: 9px;
  height: 9px;
  margin-left: 3px;
}

.scalar-api-client__item__options select {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}
</style>
