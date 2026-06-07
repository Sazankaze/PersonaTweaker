<template>
  <div class="ptm-patch-list">
    <div v-if="patches.length === 0" class="ptm-empty">
      暂无补丁，点击下方按钮添加
    </div>

    <div
      v-for="(bound, index) in patches"
      :key="getPatchId(bound, index)"
      class="ptm-patch-item"
    >
      <div class="ptm-patch-row">
        <label class="ptm-checkbox">
          <input
            type="checkbox"
            :checked="isPatchEnabled(bound)"
            @change="togglePatch(bound)"
          />
        </label>
        <span class="ptm-badge">
          {{ getPatchTypeLabel(bound) }}
        </span>
        <span class="ptm-patch-label">
          {{ getPatchLabel(bound) }}
        </span>
        <div class="ptm-patch-actions">
          <div
            v-if="index > 0"
            class="menu_button menu_button_icon ptm-icon-btn"
            title="上移"
            @click="store.movePatch(level, index, index - 1)"
          >
            <span class="fa-solid fa-chevron-up"></span>
          </div>
          <div
            v-if="index < patches.length - 1"
            class="menu_button menu_button_icon ptm-icon-btn"
            title="下移"
            @click="store.movePatch(level, index, index + 1)"
          >
            <span class="fa-solid fa-chevron-down"></span>
          </div>
          <div
            class="menu_button menu_button_icon ptm-icon-btn"
            title="编辑"
            @click="editPatch(bound, index)"
          >
            <span class="fa-solid fa-pen-to-square"></span>
          </div>
          <div
            class="menu_button menu_button_icon ptm-icon-btn"
            title="删除"
            @click="store.removePatch(level, index)"
          >
            <span class="fa-solid fa-xmark"></span>
          </div>
        </div>
      </div>
    </div>

    <div class="ptm-add-buttons">
      <div class="menu_button ptm-add-btn" @click="addInline">
        <span class="fa-solid fa-plus"></span>
        <span>添加补丁</span>
      </div>
      <div class="menu_button ptm-add-btn" @click="showLibraryPicker = true">
        <span class="fa-solid fa-book"></span>
        <span>从条目库添加</span>
      </div>
    </div>

    <PatchEditor
      v-if="editingPatch !== null"
      :patch="editingPatch"
      @save="saveEdit"
      @cancel="editingPatch = null"
    />

    <div v-if="showLibraryPicker" class="ptm-picker">
      <div class="ptm-picker-title">选择条目:</div>
      <div v-if="store.config.library.length === 0" class="ptm-empty">条目库为空，请先在条目库中添加</div>
      <div
        v-for="entry in store.config.library"
        :key="entry.id"
        class="menu_button ptm-picker-item"
        @click="addFromLibrary(entry.id)"
      >
        <span class="ptm-badge">{{ entry.patch.type }}</span>
        <span>{{ entry.name || '未命名' }}</span>
      </div>
      <div class="menu_button ptm-add-btn" style="margin-top: 8px;" @click="showLibraryPicker = false">取消</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useConfigStore } from '../store';
import PatchEditor from './PatchEditor.vue';
import type { BoundPatch, PatchOperation } from '../schema';

const props = defineProps<{ level: 'character' | 'chat' }>();
const store = useConfigStore();

const patches = computed(() => {
  const binding = props.level === 'character' ? store.currentCharBinding : store.currentChatBinding;
  return binding?.patches ?? [];
});

const editingPatch = ref<PatchOperation | null>(null);
const editingIndex = ref(-1);
const showLibraryPicker = ref(false);

function getPatchId(bound: BoundPatch, index: number): string {
  return bound.source === 'inline' ? bound.patch.id : `lib-${bound.entry_id}-${index}`;
}

function isPatchEnabled(bound: BoundPatch): boolean {
  return bound.source === 'inline' ? bound.patch.enabled : bound.enabled;
}

function getRawType(bound: BoundPatch): string {
  if (bound.source === 'library') {
    const entry = store.getLibraryEntry(bound.entry_id);
    return entry?.patch.type ?? 'append';
  }
  return bound.patch.type;
}

function getPatchTypeLabel(bound: BoundPatch): string {
  if (bound.source === 'library') {
    const entry = store.getLibraryEntry(bound.entry_id);
    return entry ? `${entry.patch.type}` : '?';
  }
  return bound.patch.type;
}

function getPatchLabel(bound: BoundPatch): string {
  if (bound.source === 'library') {
    const entry = store.getLibraryEntry(bound.entry_id);
    return `[库] ${entry?.name || '未命名条目'}`;
  }
  return bound.patch.label || bound.patch.value.slice(0, 50) || '空补丁';
}

function togglePatch(bound: BoundPatch) {
  if (bound.source === 'inline') {
    bound.patch.enabled = !bound.patch.enabled;
  } else {
    bound.enabled = !bound.enabled;
  }
}

function addInline() {
  store.addInlinePatch(props.level, { type: 'append', value: '' });
  const binding = props.level === 'character' ? store.currentCharBinding : store.currentChatBinding;
  if (binding) {
    const last = binding.patches[binding.patches.length - 1];
    if (last?.source === 'inline') {
      editingPatch.value = { ...last.patch };
      editingIndex.value = binding.patches.length - 1;
    }
  }
}

function editPatch(bound: BoundPatch, index: number) {
  if (bound.source === 'library') {
    toastr.info('条目库条目请在条目库标签页中编辑');
    return;
  }
  editingPatch.value = { ...bound.patch };
  editingIndex.value = index;
}

function saveEdit(patch: PatchOperation) {
  const binding = props.level === 'character' ? store.currentCharBinding : store.currentChatBinding;
  if (binding && editingIndex.value >= 0) {
    const bound = binding.patches[editingIndex.value];
    if (bound?.source === 'inline') {
      Object.assign(bound.patch, patch);
    }
  }
  editingPatch.value = null;
  editingIndex.value = -1;
}

function addFromLibrary(entryId: string) {
  store.addLibraryRef(props.level, entryId);
  showLibraryPicker.value = false;
}
</script>

<style scoped>
.ptm-empty {
  opacity: 0.5;
  padding: 12px 0;
  text-align: center;
}
.ptm-patch-item {
  padding: 5px 8px;
  border: 1px solid var(--SmartThemeBorderColor);
  border-radius: 4px;
  margin-bottom: 3px;
}
.ptm-patch-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.ptm-checkbox input {
  width: 16px;
  height: 16px;
  cursor: pointer;
}
.ptm-badge {
  font-size: 0.8em;
  padding: 1px 5px;
  border-radius: 3px;
  background: var(--SmartThemeBlurTintColor);
  white-space: nowrap;
}
.ptm-patch-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.9em;
}
.ptm-patch-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}
.ptm-icon-btn {
  padding: 4px 8px;
  min-width: unset;
}
.ptm-add-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
}
.ptm-add-btn {
  padding: 8px 16px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  flex-shrink: 0;
}
.ptm-picker {
  margin-top: 12px;
  padding: 12px;
  border: 1px solid var(--SmartThemeBorderColor);
  border-radius: 6px;
}
.ptm-picker-title {
  font-weight: bold;
  margin-bottom: 8px;
}
.ptm-picker-item {
  padding: 8px 12px;
  margin: 4px 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}
</style>
