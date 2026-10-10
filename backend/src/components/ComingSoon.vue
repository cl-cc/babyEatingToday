<script setup lang="ts">
defineProps<{
  title: string
  nextStep: string
}>()
</script>

<template>
  <section class="page-card coming">
    <h3>{{ title }}</h3>
    <p>该模块第一阶段仅提供页面框架，业务编辑能力开发中。</p>
    <p class="coming__next">下一阶段：{{ nextStep }}</p>
    <el-alert
      title="当前没有可执行的业务操作，避免误操作未实现功能。"
      type="info"
      :closable="false"
      show-icon
    />
  </section>
</template>

<style scoped>
.coming {
  padding: 24px;
}

h3 {
  margin: 0 0 8px;
  font-size: 16px;
}

p {
  margin: 0 0 10px;
  color: var(--app-muted);
  font-size: 13px;
  line-height: 1.7;
}

.coming__next {
  color: var(--app-text);
}
</style>
