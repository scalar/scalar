<template>
  <div class="introduction-card-item">
    <slot />
  </div>
</template>

<style scoped>
.introduction-card-item {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}
.introduction-card-item:empty {
  display: none;
}
.introduction-card-item:has(.description) :deep(.server-form-container) {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}
.introduction-card-item :deep(.request-item) {
  border-bottom: 0;
}
</style>
