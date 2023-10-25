<script setup lang="ts"></script>
<template>
  <div class="make-it-pop texture">
    <b><slot name="title" /></b>
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
  opacity: 0.4;
}
.dark-mode .human {
  opacity: 0.7;
}
.human i {
  width: 100%;
  height: 1px;
  background: #4c4316;
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
  background: var(--scalar-brand);
  border-radius: var(--theme-radius);
  overflow: hidden;
  position: relative;
  padding: 12px 60px 12px 12px;
  min-height: 80px;
}
.make-it-pop b {
  font-weight: var(--theme-semibold);
  font-size: var(--theme-font-size-3);
}
.make-it-pop p {
  font-size: var(--theme-font-size-3);
  margin-top: 3px;
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
.texture:after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MDAiIGhlaWdodD0iNTAwIj4KICAgIDxmaWx0ZXIgaWQ9Im5vaXNlIiB4PSIwIiB5PSIwIj4KICAgICAgPGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuNjUiIG51bU9jdGF2ZXM9IjMiIHN0aXRjaFRpbGVzPSJzdGl0Y2giLz4KICAgICAgPGZlQmxlbmQgbW9kZT0ic2NyZWVuIi8+CiAgICA8L2ZpbHRlcj4KICAgIDxyZWN0IHdpZHRoPSI1MDAiIGhlaWdodD0iNTAwIiBmaWx0ZXI9InVybCgjbm9pc2UpIiBvcGFjaXR5PSIwLjUiLz4KPC9zdmc+);
  opacity: 40%;
  pointer-events: none;
}
.dark-mode .texture:after {
  opacity: 0.2;
}
</style>
