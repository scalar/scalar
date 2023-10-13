<script lang="ts" setup>
// TODO: value.xml isn’t rendered yet
import Schema from './Schema.vue'

defineProps<{ value: Record<string, any> }>()
</script>
<template>
  type: {{ value.type }}
  <table v-if="value.properties">
    <tr
      v-for="property in Object.keys(value.properties)"
      :key="property">
      <td>
        {{ property }}

        <div v-if="value?.required?.includes(property)">required</div>
        <div v-else>optional</div>
      </td>
      <td>
        <Schema
          v-if="value.properties[property]"
          :value="value.properties[property]" />
      </td>
    </tr>
  </table>
</template>
