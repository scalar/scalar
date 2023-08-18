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
  border-radius: var(--scalar-api-client-rounded);
  margin-bottom: 6px;
  background: var(--scalar-api-client-background-secondary);
  box-shadow: var(--shadow1);
  position: relative;
}

.scalar-api-client__item button {
  background-color: transparent;
}

.scalar-api-client__item:hover {
  cursor: pointer;
}

.scalar-api-client__item--open {
  background: var(--scalar-api-client-background-secondary);
}

.scalar-api-client__item--open:focus-within {
  box-shadow: var(--shadow1);
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
}

.scalar-api-client__item .scalar-api-client__item__title {
  color: var(--scalar-api-client-text-color-primary);
  font-size: var(--scalar-api-client-text-sm);
  font-weight: var(--scalar-api-client-font-bold);
  user-select: none;
  flex: 1;
}

.scalar-api-client__item .scalar-api-client__item__title:after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: block;
}

.scalar-api-client__item .scalar-api-client__toggle__icon {
  width: 10px;
  margin-right: 6px;
  color: var(--scalar-api-client-text-color-primary);
}

.scalar-api-client__item__options {
  position: relative;
}

.scalar-api-client__item__options span {
  background: var(--scalar-api-client-background-muted);
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 12px;
  pointer-events: none;
  color: var(--scalar-api-client-text-color-secondary);
  border: var(--scalar-api-client-border);
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
