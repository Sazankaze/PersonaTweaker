<template>
  <div class="persona-tweaker-widget">
    <div class="inline-drawer">
      <div class="inline-drawer-toggle inline-drawer-header">
        <b>设定微调</b>
        <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
      </div>
      <div class="inline-drawer-content">
        <div class="flex-container flexFlowColumn" style="gap: 6px;">
          <small v-if="!store.currentCharacter" style="opacity: 0.6;">未选择角色</small>
          <template v-else>
            <small style="opacity: 0.7;">
              角色补丁: {{ store.charPatchCount }}条
              &nbsp;|&nbsp;
              聊天补丁: {{ store.chatPatchCount }}条
            </small>
          </template>
          <div>
            <input
              class="menu_button"
              type="submit"
              value="管理微调"
              :disabled="!store.currentCharacter"
              @click="openManager"
            />
          </div>
        </div>
        <hr class="sysHR" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useConfigStore } from '../store';
import { openManagementPopup } from './popup';

const store = useConfigStore();

function openManager() {
  openManagementPopup();
}
</script>

<style scoped></style>
