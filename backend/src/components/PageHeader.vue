<script setup lang="ts">
defineProps<{
  title: string
  description: string
}>()
</script>

<template>
  <header class="page-header">
    <div>
      <h2>{{ title }}</h2>
      <p>{{ description }}</p>
    </div>
    <div class="page-header__extra">
      <slot />
    </div>
  </header>
</template>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
}

h2 {
  margin: 0 0 6px;
  font-size: 18px;
  font-weight: 600;
}

p {
  margin: 0;
  color: var(--app-muted);
  font-size: 13px;
  line-height: 1.6;
}

.page-header__extra {
  display: flex;
  gap: 8px;
}
</style>
