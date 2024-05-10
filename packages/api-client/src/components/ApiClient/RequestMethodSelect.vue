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
  align-items: center;
  appearance: none;
  background: var(--scalar-api-client-color, var(--scalar-background-3));
  background: color-mix(
    in srgb,
    var(--scalar-api-client-color, var(--scalar-background-3)),
    transparent 90%
  );
  border-radius: var(--scalar-radius);
  color: var(--scalar-api-client-color);
  display: flex;
  -webkit-appearance: none;
  padding: 0 12px;
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
</style>
