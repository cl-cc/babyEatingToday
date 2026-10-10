<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    value: number
    duration?: number
  }>(),
  { duration: 900 },
)

const display = ref(0)
let frame = 0

function stop() {
  if (frame) cancelAnimationFrame(frame)
  frame = 0
}

function animate(to: number) {
  stop()
  const from = display.value
  if (from === to) return
  const start = performance.now()
  const tick = (now: number) => {
    const progress = Math.min(1, (now - start) / props.duration)
    const eased = 1 - (1 - progress) ** 3
    display.value = Math.round(from + (to - from) * eased)
    if (progress < 1) {
      frame = requestAnimationFrame(tick)
    }
  }
  frame = requestAnimationFrame(tick)
}

watch(
  () => props.value,
  (to) => animate(Number(to) || 0),
  { immediate: true },
)

onBeforeUnmount(stop)
</script>

<template>
  <span>{{ display }}</span>
</template>
