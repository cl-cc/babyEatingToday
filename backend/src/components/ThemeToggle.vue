<script setup lang="ts">
import { Moon, Sunny } from '@element-plus/icons-vue'
import { useDark } from '@vueuse/core'
import { ref } from 'vue'

const isDark = useDark({
  storageKey: 'tuanzi_admin_theme',
})

const switchRef = ref<HTMLElement>()

function toggleDark() {
  const switchEl = switchRef.value
  if (!document.startViewTransition || !switchEl) {
    isDark.value = !isDark.value
    return
  }

  const rect = switchEl.getBoundingClientRect()
  const x = rect.left + rect.width / 2
  const y = rect.top + rect.height / 2
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
  const transition = document.startViewTransition(() => {
    isDark.value = !isDark.value
  })

  void transition.ready.then(() => {
    const clipPath = [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`]
    document.documentElement.animate(
      { clipPath },
      {
        duration: 400,
        easing: 'ease-in',
        pseudoElement: '::view-transition-new(root)',
      },
    )
  })
}
</script>

<template>
  <div
    class="toggle"
    ref="switchRef"
    :title="isDark ? '切换为浅色模式' : '切换为暗黑模式'"
    @click.stop="toggleDark()"
  >
    <el-icon v-show="!isDark" :size="18"><Moon /></el-icon>
    <el-icon v-show="isDark" :size="18"><Sunny /></el-icon>
  </div>
</template>

<style scoped>
.toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  color: var(--app-muted);
  cursor: pointer;
  user-select: none;
}

.toggle:hover {
  color: var(--app-primary);
}
</style>
