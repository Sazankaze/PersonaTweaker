<template>
  <div class="ptm-editor">
    <div class="ptm-editor-title">{{ isNew ? '新建条目' : '编辑条目' }}</div>

    <div class="ptm-editor-form">
      <div class="ptm-field">
        <label class="ptm-field-label">名称</label>
        <input class="text_pole" v-model="local.name" placeholder="条目名称" />
      </div>

      <div class="ptm-field">
        <label class="ptm-field-label">描述</label>
        <input class="text_pole" v-model="local.description" placeholder="可选的描述" />
      </div>

      <div class="ptm-field-row">
        <div class="ptm-field" style="flex: 0 0 auto;">
          <label class="ptm-field-label">类型</label>
          <select class="text_pole" v-model="local.patch.type">
            <option value="append">追加 (append)</option>
            <option value="prepend">前置 (prepend)</option>
            <option value="delete">删除 (delete)</option>
            <option value="replace">替换 (replace)</option>
          </select>
        </div>

        <div v-if="showRegex" class="ptm-field" style="flex: 0 0 auto;">
          <label class="ptm-checkbox-field">
            <input type="checkbox" v-model="local.patch.use_regex" />
            <span>使用正则表达式</span>
          </label>
        </div>
      </div>

      <div class="ptm-field">
        <label class="ptm-field-label">
          {{ local.patch.type === 'replace' ? '查找' : '内容' }}
        </label>
        <textarea
          class="text_pole"
          v-model="local.patch.value"
          rows="4"
        ></textarea>
      </div>

      <div v-if="local.patch.type === 'replace'" class="ptm-field">
        <label class="ptm-field-label">替换为</label>
        <textarea
          class="text_pole"
          v-model="local.patch.replacement"
          rows="4"
        ></textarea>
      </div>

      <div class="ptm-editor-actions">
        <div class="menu_button ptm-action-btn ptm-btn-primary" @click="save">保存</div>
        <div class="menu_button ptm-action-btn" @click="$emit('cancel')">取消</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { LibraryEntry } from '../schema';

const props = defineProps<{ entry: LibraryEntry }>();
const emit = defineEmits<{
  save: [entry: LibraryEntry];
  cancel: [];
}>();

const local = ref(klona(props.entry));
const isNew = computed(() => !props.entry.name);
const showRegex = computed(() => local.value.patch.type === 'delete' || local.value.patch.type === 'replace');

watch(() => local.value.patch.type, (type) => {
  if (type === 'append' || type === 'prepend') local.value.patch.use_regex = false;
});

function save() {
  emit('save', klona(local.value));
}
</script>

<style scoped>
.ptm-editor {
  padding: 16px;
  border: 1px solid var(--SmartThemeBorderColor);
  border-radius: 6px;
  background: var(--SmartThemeBlurTintColor);
}
.ptm-editor-title {
  font-weight: bold;
  margin-bottom: 12px;
}
.ptm-editor-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.ptm-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.ptm-field-row {
  display: flex;
  gap: 16px;
  align-items: flex-end;
}
.ptm-field-label {
  font-size: 0.85em;
  opacity: 0.7;
  font-weight: bold;
}
.ptm-field textarea {
  width: 100%;
  resize: vertical;
  min-height: 60px;
}
.ptm-checkbox-field {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 0;
  cursor: pointer;
}
.ptm-editor-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 4px;
}
.ptm-action-btn {
  padding: 8px 24px;
  white-space: nowrap;
  flex-shrink: 0;
}
.ptm-btn-primary {
  font-weight: bold;
}
</style>
