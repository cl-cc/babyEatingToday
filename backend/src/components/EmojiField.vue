<script setup lang="ts">
import { useDark } from '@vueuse/core'
import { ref } from 'vue'
import EmojiPicker from 'vue3-emoji-picker'
import 'vue3-emoji-picker/css'

defineProps<{
  modelValue: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const isDark = useDark({ storageKey: 'tuanzi_admin_theme' })
const visible = ref(false)

const groupOrder = ['food_drink', 'animals_nature', 'smileys_people', 'objects', 'travel_places', 'activities', 'symbols']
const groupNames = {
  food_drink: '食物饮料',
  animals_nature: '动物自然',
  smileys_people: '表情人物',
  objects: '物品',
  travel_places: '旅行地点',
  activities: '活动',
  symbols: '符号',
}

function onSelect(emoji: { i?: string }) {
  if (emoji.i) emit('update:modelValue', emoji.i)
  visible.value = false
}
</script>

<template>
  <el-popover
    v-model:visible="visible"
    :disabled="disabled"
    placement="bottom-start"
    :width="352"
    trigger="click"
    :show-arrow="false"
    popper-class="emoji-field-popper"
  >
    <template #reference>
      <button class="emoji-field" type="button" :disabled="disabled">
        <span class="emoji-field__preview">{{ modelValue || '＋' }}</span>
        <span class="emoji-field__meta">
          <strong>{{ modelValue ? '更换图标' : '挑选图标' }}</strong>
          <em>{{ modelValue ? '可搜索蔬菜、水果、肉类' : '支持搜索和分类筛选' }}</em>
        </span>
      </button>
    </template>
    <EmojiPicker
      :native="true"
      :hide-search="false"
      :disable-skin-tones="true"
      :display-recent="true"
      :theme="isDark ? 'dark' : 'light'"
      :disabled-groups="['flags']"
      :group-order="groupOrder"
      :group-names="groupNames"
      :static-texts="{ placeholder: '搜索：西兰花、苹果、鸡蛋…' }"
      @select="onSelect"
    />
  </el-popover>
</template>

<style scoped>
.emoji-field {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  background: var(--app-bg);
  color: var(--app-text);
  text-align: left;
  cursor: pointer;
}

.emoji-field:hover:not(:disabled) {
  border-color: var(--app-primary);
}

.emoji-field:disabled {
  cursor: default;
  opacity: 0.72;
}

.emoji-field__preview {
  width: 40px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: var(--app-surface);
  font-size: 24px;
  line-height: 1;
}

.emoji-field__meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.emoji-field__meta strong {
  font-size: 13px;
  font-weight: 600;
}

.emoji-field__meta em {
  font-size: 12px;
  font-style: normal;
  color: var(--app-muted);
}
</style>
