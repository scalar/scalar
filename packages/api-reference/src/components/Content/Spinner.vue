<template>
  <span class="scalar-logo-animation scalar-logo-animation-load">
    <i class="line line-1"></i>
    <i class="line line-2"></i>
    <i class="line line-3"></i>
    <i class="line line-4"></i>
  </span>
</template>
<style scoped>
.scalar-logo-animation {
  width: 38px;
  height: 38px;
  position: relative;
  display: flex;
  align-items: center;
}
.scalar-logo-animation .line:before {
  content: '';
  width: 100%;
  height: 100%;
  background: #4c4316;
  display: block;
  position: absolute;
}
.scalar-logo-animation .line {
  position: absolute;
  width: 100%;
  height: 1px;
  overflow: hidden;
}
.scalar-logo-animation .line-2 {
  transform: rotate(90deg);
}
.scalar-logo-animation .line-3 {
  transform: rotate(45deg);
}
.scalar-logo-animation .line-4 {
  transform: rotate(-45deg);
}
.scalar-logo-animation-load {
  animation: rotate 2s linear infinite;
}
@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
