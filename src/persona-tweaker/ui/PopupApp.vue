<template>
  <div class="persona-tweaker-manager">
    <h3 class="ptm-title">设定微调 - {{ store.currentCharacter ?? '未选择角色' }}</h3>

    <div class="ptm-tabs">
      <div
        v-for="tab in tabs"
        :key="tab.key"
        class="menu_button ptm-tab"
        :class="{ 'ptm-tab-active': activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        <span :class="tab.icon"></span>
        {{ tab.label }}
      </div>
      <div
        class="menu_button ptm-tab"
        :class="{ 'ptm-tab-active': activeTab === 'preview' }"
        @click="showPreview"
      >
        <span class="fa-solid fa-eye"></span>
        预览
      </div>
    </div>

    <div class="ptm-content">
      <div v-if="activeTab === 'character'">
        <h4 class="ptm-section-title">角色级补丁 ({{ store.currentCharacter }})</h4>
        <p class="ptm-hint">对该角色所有聊天生效</p>
        <PatchList level="character" />
      </div>

      <div v-else-if="activeTab === 'chat'">
        <h4 class="ptm-section-title">聊天级补丁 ({{ chatDisplayName }})</h4>
        <p class="ptm-hint">仅对当前聊天生效，在角色级补丁之后应用</p>
        <PatchList level="chat" />
      </div>

      <div v-else-if="activeTab === 'library'">
        <h4 class="ptm-section-title">条目库</h4>
        <p class="ptm-hint">保存常用的补丁条目，可快速添加到任意角色或聊天</p>
        <LibraryManager />
      </div>

      <div v-else-if="activeTab === 'preview'">
        <h4 class="ptm-section-title">补丁预览</h4>
        <p class="ptm-hint">
          <span class="ptm-diff-legend-del">删除线</span> = 被删除的内容，
          <span class="ptm-diff-legend-add">粗体</span> = 新增的内容
        </p>

        <div v-if="previewLoading" style="opacity: 0.5; padding: 12px 0;">加载中...</div>
        <div v-else-if="!previewOriginal" style="opacity: 0.5; padding: 12px 0;">未设置 persona description</div>
        <template v-else>
          <div v-if="previewPatched === previewOriginal" style="opacity: 0.5; margin-bottom: 12px;">
            当前补丁未产生任何变化
          </div>
          <div class="ptm-diff-box">
            <template v-for="(chunk, i) in diffChunks" :key="i">
              <span v-if="chunk.type === 'same'">{{ chunk.text }}</span>
              <span v-else-if="chunk.type === 'removed'" class="ptm-diff-del">{{ chunk.text }}</span>
              <span v-else-if="chunk.type === 'added'" class="ptm-diff-add">{{ chunk.text }}</span>
            </template>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useConfigStore } from '../store';
import { computePatchedPersona } from '../engine';
import PatchList from './PatchList.vue';
import LibraryManager from './LibraryManager.vue';

const store = useConfigStore();

const tabs = [
  { key: 'character', label: '角色', icon: 'fa-solid fa-user' },
  { key: 'chat', label: '聊天', icon: 'fa-solid fa-comments' },
  { key: 'library', label: '条目库', icon: 'fa-solid fa-book' },
] as const;

const activeTab = ref<'character' | 'chat' | 'library' | 'preview'>('character');
const previewOriginal = ref('');
const previewPatched = ref('');
const previewLoading = ref(false);

const chatDisplayName = computed(() => {
  const id = store.currentChatId;
  if (!id) return '';
  return id.replace(/\.jsonl$/i, '').split('/').pop() ?? id;
});

type DiffChunk = { type: 'same' | 'added' | 'removed'; text: string };

const diffChunks = computed(() => {
  if (!previewOriginal.value) return [];
  return computeDiff(previewOriginal.value, previewPatched.value);
});

function computeDiff(oldText: string, newText: string): DiffChunk[] {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');

  const lcs = lcsLines(oldLines, newLines);
  const result: DiffChunk[] = [];
  let oi = 0, ni = 0, li = 0;

  while (oi < oldLines.length || ni < newLines.length) {
    if (li < lcs.length && oi < oldLines.length && ni < newLines.length && oldLines[oi] === lcs[li] && newLines[ni] === lcs[li]) {
      result.push({ type: 'same', text: oldLines[oi] + '\n' });
      oi++; ni++; li++;
    } else {
      if (oi < oldLines.length && (li >= lcs.length || oldLines[oi] !== lcs[li])) {
        result.push({ type: 'removed', text: oldLines[oi] + '\n' });
        oi++;
      } else if (ni < newLines.length && (li >= lcs.length || newLines[ni] !== lcs[li])) {
        result.push({ type: 'added', text: newLines[ni] + '\n' });
        ni++;
      }
    }
  }

  return result;
}

function lcsLines(a: string[], b: string[]): string[] {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  const result: string[] = [];
  let i = m, j = n;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) { result.unshift(a[i - 1]); i--; j--; }
    else if (dp[i - 1][j] > dp[i][j - 1]) i--;
    else j--;
  }
  return result;
}

async function showPreview() {
  activeTab.value = 'preview';
  previewLoading.value = true;
  try {
    const raw = ($('#persona_description').val() as string) ?? '';
    if (raw && store.currentCharacter) {
      const expanded = substitudeMacros(raw);
      previewOriginal.value = expanded;
      previewPatched.value = computePatchedPersona(expanded, store.currentCharacter, store.currentChatId, store.config);
    } else {
      previewOriginal.value = raw;
      previewPatched.value = raw;
    }
  } catch {
    previewOriginal.value = '';
    previewPatched.value = '';
  }
  previewLoading.value = false;
}
</script>

<style scoped>
.ptm-title {
  margin: 0 0 12px;
  font-size: 1.2em;
}
.ptm-tabs {
  display: flex;
  flex-wrap: nowrap;
  gap: 4px;
  margin-bottom: 14px;
  border-bottom: 1px solid var(--SmartThemeBorderColor);
  padding-bottom: 10px;
}
.ptm-tab {
  padding: 6px 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  flex-shrink: 0;
  font-size: 0.85em;
}
.ptm-tab-active {
  background: var(--SmartThemeBlurTintColor);
}
.ptm-content {
  min-height: 300px;
}
.ptm-section-title {
  margin: 0 0 4px;
  font-size: 1.05em;
}
.ptm-hint {
  margin: 0 0 12px;
  font-size: 0.85em;
  opacity: 0.5;
}
.ptm-diff-legend-del {
  text-decoration: line-through;
  opacity: 0.6;
}
.ptm-diff-legend-add {
  font-weight: bold;
}
.ptm-diff-box {
  padding: 12px;
  border: 1px solid var(--SmartThemeBorderColor);
  border-radius: 6px;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 0.85em;
  max-height: 400px;
  overflow-y: auto;
  line-height: 1.6;
}
.ptm-diff-del {
  text-decoration: line-through;
  opacity: 0.5;
  background: rgba(244, 67, 54, 0.1);
}
.ptm-diff-add {
  font-weight: bold;
  background: rgba(76, 175, 80, 0.1);
}
</style>
