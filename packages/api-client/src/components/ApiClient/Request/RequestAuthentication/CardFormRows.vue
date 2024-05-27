<template>
  <div class="card-form-rows">
    <slot />
  </div>
</template>

<style scoped>
:where(.card-form-rows) {
  display: flex;
  flex-direction: column;
  width: 100%;
}
</style>
