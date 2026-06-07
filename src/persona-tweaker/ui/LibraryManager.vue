<template>
  <div class="ptm-library">
    <div v-if="store.config.library.length === 0" class="ptm-empty">
      条目库为空，点击下方按钮添加条目
    </div>

    <div
      v-for="(entry, index) in store.config.library"
      :key="entry.id"
      class="ptm-lib-entry"
    >
      <div class="ptm-lib-entry-header">
        <span class="ptm-badge" :class="'ptm-badge-' + entry.patch.type">{{ entry.patch.type }}</span>
        <span class="ptm-lib-name">{{ entry.name || '未命名' }}</span>
        <div class="ptm-lib-actions">
          <div class="menu_button menu_button_icon ptm-icon-btn" title="编辑" @click="startEdit(index)">
            <span class="fa-solid fa-pen-to-square"></span>
          </div>
          <div class="menu_button menu_button_icon ptm-icon-btn" title="删除" @click="confirmDelete(entry.id)">
            <span class="fa-solid fa-xmark"></span>
          </div>
        </div>
      </div>
      <div v-if="entry.description" class="ptm-lib-desc">{{ entry.description }}</div>
      <div class="ptm-lib-preview">{{ previewValue(entry) }}</div>

      <div v-if="editingIndex === index" style="margin-top: 10px;">
        <LibraryEntryEditor
          :entry="entry"
          @save="saveEntry(index, $event)"
          @cancel="editingIndex = -1"
        />
      </div>
    </div>

    <div class="menu_button ptm-add-btn" @click="addEntry">
      <span class="fa-solid fa-plus"></span>
      <span>添加条目</span>
    </div>

    <div v-if="creatingNew" style="margin-top: 10px;">
      <LibraryEntryEditor
        :entry="newEntry"
        @save="saveNewEntry"
        @cancel="creatingNew = false"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useConfigStore } from '../store';
import { LibraryEntry } from '../schema';
import type { LibraryEntry as LibraryEntryType } from '../schema';
import LibraryEntryEditor from './LibraryEntryEditor.vue';

const store = useConfigStore();
const editingIndex = ref(-1);
const creatingNew = ref(false);

const newEntry = ref<LibraryEntryType>(LibraryEntry.parse({
  name: '',
  patch: { type: 'append', value: '' },
}));

function previewValue(entry: LibraryEntryType): string {
  const v = entry.patch.value;
  if (!v) return '(空)';
  return v.length > 80 ? v.slice(0, 80) + '...' : v;
}

function startEdit(index: number) {
  editingIndex.value = index;
}

function saveEntry(index: number, updated: LibraryEntryType) {
  Object.assign(store.config.library[index], updated);
  editingIndex.value = -1;
}

function confirmDelete(id: string) {
  if (confirm('确定要删除这个条目吗？已绑定此条目的补丁将变为无效。')) {
    store.removeLibraryEntry(id);
  }
}

function addEntry() {
  newEntry.value = LibraryEntry.parse({
    name: '',
    patch: { type: 'append', value: '' },
  });
  creatingNew.value = true;
}

function saveNewEntry(entry: LibraryEntryType) {
  store.addLibraryEntry(entry);
  creatingNew.value = false;
}
</script>

<style scoped>
.ptm-empty {
  opacity: 0.5;
  padding: 12px 0;
  text-align: center;
}
.ptm-lib-entry {
  padding: 10px 14px;
  border: 1px solid var(--SmartThemeBorderColor);
  border-radius: 6px;
  margin-bottom: 8px;
}
.ptm-lib-entry-header {
  display: flex;
  align-items: center;
  gap: 10px;
}
.ptm-badge {
  font-size: 0.8em;
  padding: 1px 5px;
  border-radius: 3px;
  background: var(--SmartThemeBlurTintColor);
  white-space: nowrap;
}
.ptm-lib-name {
  flex: 1;
  font-weight: bold;
  font-size: 0.95em;
}
.ptm-lib-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}
.ptm-icon-btn {
  padding: 4px 8px;
  min-width: unset;
}
.ptm-lib-desc {
  font-size: 0.85em;
  opacity: 0.6;
  margin-top: 4px;
}
.ptm-lib-preview {
  font-size: 0.8em;
  opacity: 0.4;
  margin-top: 4px;
  font-family: monospace;
  word-break: break-all;
}
.ptm-add-btn {
  padding: 8px 16px;
  margin-top: 10px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  flex-shrink: 0;
}
</style>
