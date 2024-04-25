<script setup lang="ts">
import fonts from '../fonts.css?inline'
</script>

<template>
  <!-- We can’t use <style> tags in Vue components. -->
  <component :is="'style'">
    {{ fonts }}
  </component>
</template>
