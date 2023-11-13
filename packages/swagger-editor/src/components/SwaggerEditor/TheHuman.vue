<script setup lang="ts"></script>
<template>
  <div class="make-it-pop">
    <slot name="title" />
    <p>
      <slot name="description" />
    </p>
    <div class="human">
      <i></i>
      <i></i>
      <i></i>
      <i></i>
      <i></i>
      <i></i>
      <i></i>
      <i></i>
      <i></i>
      <i></i>
      <i></i>
      <i></i>
      <i></i>
      <i></i>
      <i></i>
      <i></i>
      <i></i>
      <i></i>
      <i></i>
      <i></i>
    </div>
  </div>
</template>
<style scoped>
.human {
  width: 36px;
  position: absolute;
  right: 0;
  top: 50%;
  transform: translate3d(0, -50%, 0);
  height: 66px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  opacity: 0.7;
}
.dark-mode .human {
  opacity: 0.7;
}
.human i {
  width: 100%;
  height: 1px;
  background: var(--theme-color-3, var(--default-theme-color-3));
  display: block;
  position: relative;
  transform: translate3d(100%, 0, 0);
  animation: example 0.35s forwards;
}
@keyframes example {
  from {
    transform: translate3d(100%, 0, 0);
  }
  to {
    transform: translate3d(0, 0, 0);
  }
}
.make-it-pop {
  overflow: hidden;
  position: relative;
  padding: 24px 60px 12px 24px;
  min-height: 80px;
  color: var(--theme-color-1, var(--default-theme-color-1));
}
.make-it-pop :deep(h1) {
  font-size: var(--theme-heading-2, var(--default-theme-heading-2));
  margin-top: 0;
  line-height: 1.45;
  margin-bottom: 0;
  font-weight: var(--theme-bold, var(--default-theme-bold));
  color: var(--theme-color-1, var(--default-theme-color-1));
  width: 100%;
}
.make-it-pop p {
  margin-top: 3px;
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
  font-size: var(--theme-mini, var(--default-theme-mini));
  color: var(--theme-color-2, var(--default-theme-color-2));
  line-height: 1.4;
  width: 100%;
}
.human i:nth-of-type(1) {
  left: 30px;
  animation-delay: 0.1s;
}
.human i:nth-of-type(2) {
  left: 24px;
  animation-delay: 0.15s;
}
.human i:nth-of-type(3) {
  left: 20px;
  animation-delay: 0.2s;
}
.human i:nth-of-type(4) {
  left: 17px;
  animation-delay: 0.25s;
}
.human i:nth-of-type(5) {
  left: 15px;
  animation-delay: 0.3s;
}
.human i:nth-of-type(6) {
  left: 14.5px;
  animation-delay: 0.35s;
}
.human i:nth-of-type(7) {
  left: 14px;
  animation-delay: 0.4s;
}
.human i:nth-of-type(8) {
  left: 14px;
  animation-delay: 0.45s;
}
.human i:nth-of-type(9) {
  left: 15px;
  animation-delay: 0.5s;
}
.human i:nth-of-type(10) {
  left: 13px;
  animation-delay: 0.55s;
}
.human i:nth-of-type(11) {
  left: 11px;
  animation-delay: 0.6s;
}
.human i:nth-of-type(12) {
  left: 9px;
  animation-delay: 0.65s;
}
.human i:nth-of-type(13) {
  left: 8px;
  animation-delay: 0.7s;
}
.human i:nth-of-type(14) {
  left: 12px;
  animation-delay: 0.75s;
}
.human i:nth-of-type(15) {
  left: 10px;
  animation-delay: 0.8s;
}
.human i:nth-of-type(16) {
  left: 13px;
  animation-delay: 0.85s;
}
.human i:nth-of-type(17) {
  left: 14px;
  animation-delay: 0.9s;
}
.human i:nth-of-type(18) {
  left: 17px;
  animation-delay: 0.95s;
}
.human i:nth-of-type(19) {
  left: 18px;
  animation-delay: 1s;
}
.human i:nth-of-type(20) {
  left: 30px;
  animation-delay: 1.05s;
}
</style>
