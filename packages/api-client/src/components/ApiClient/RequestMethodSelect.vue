<script lang="ts" setup>
withDefaults(defineProps<{ requestMethod: string; readOnly?: boolean }>(), {
  readOnly: true,
})

defineEmits<{
  (e: 'change', value: string): void
}>()

// TODO: Support all request methods
const supportedRequestMethods = [
  'GET',
  'POST',
  'PUT',
  // 'HEAD',
  'DELETE',
  'PATCH',
  // 'OPTIONS',
  // 'CONNECT',
  // 'TRACE',
]
</script>
<template>
  <div class="request-method-select">
    <span
      class="request-method"
      :class="{ 'request-method--disabled': readOnly }">
      <i :class="requestMethod.toLowerCase()" />
      <span>{{ requestMethod }}</span>
    </span>
    <select
      :disabled="readOnly"
      :value="requestMethod.toLowerCase()"
      @input="
        (event) => $emit('change', (event.target as HTMLSelectElement).value)
      ">
      <option
        v-for="validRequestMethod in supportedRequestMethods"
        :key="validRequestMethod"
        :value="validRequestMethod.toLocaleLowerCase()">
        {{ validRequestMethod }}
      </option>
    </select>
  </div>
</template>

<style scoped>
.request-method-select {
  position: relative;
  display: flex;
}

.request-method-select select {
  border: none;
  outline: none;
  cursor: pointer;
  background: var(--scalar-background-3);
  box-shadow: -2px 0 0 0 var(--scalar-background-3);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  -moz-appearance: none;
  -webkit-appearance: none;
  appearance: none;
}

.request-method-select select[disabled] {
  pointer-events: none;
}

.request-method {
  display: flex;
  align-items: center;
  color: var(--scalar-color-3);
  appearance: none;
  -webkit-appearance: none;
  padding: 0 12px;
  border-right: 1px solid var(--scalar-border-color);
  position: relative;
}
.request-method span {
  font-family: var(--scalar-font-code);
  font-size: 500;
  font-size: var(--scalar-micro);
  text-transform: uppercase;
  display: flex;
  align-items: center;
}

.request-method:not(.request-method--disabled) span:after {
  content: '';
  width: 7px;
  height: 7px;
  transform: rotate(45deg) translate3d(-2px, -2px, 0);
  display: block;
  margin-left: 6px;
  box-shadow: 1px 1px 0 currentColor;
}

.request-method i {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 6px;
  text-align: center;
  line-height: 18px;
  font-style: normal;
  flex-shrink: 0;
  display: inline-block;
  color: var(--scalar-color-disabled);
  background: var(--scalar-api-client-color);
}
</style>
