import { ScriptConfig, PatchOperation, LibraryEntry } from './schema';
import type { ScriptConfig as ScriptConfigType, BindingConfig as BindingConfigType } from './schema';

const STORAGE_KEY = 'persona_tweaker';
const GLOBAL_VAR = { type: 'global' as const };

function loadConfig(): ScriptConfigType {
  const vars = getVariables(GLOBAL_VAR);
  return ScriptConfig.parse(vars[STORAGE_KEY] ?? {});
}

function saveConfig(config: ScriptConfigType) {
  insertOrAssignVariables({ [STORAGE_KEY]: klona(config) }, GLOBAL_VAR);
}

export const pinia = createPinia();

export const useConfigStore = defineStore('persona-tweaker-config', () => {
  const config = ref<ScriptConfigType>(loadConfig());

  watchEffect(() => {
    saveConfig(config.value);
  });

  const currentCharacter = ref<string | null>(getCurrentCharacterName());
  const currentChatId = ref<string>(SillyTavern.getCurrentChatId());

  function refreshContext() {
    currentCharacter.value = getCurrentCharacterName();
    currentChatId.value = SillyTavern.getCurrentChatId();
  }

  const charKey = computed(() => currentCharacter.value ?? '');
  const chatKey = computed(() =>
    currentCharacter.value ? `${currentCharacter.value}::${currentChatId.value}` : '',
  );

  const currentCharBinding = computed(() =>
    charKey.value ? config.value.characters[charKey.value] ?? null : null,
  );
  const currentChatBinding = computed(() =>
    chatKey.value ? config.value.chats[chatKey.value] ?? null : null,
  );

  const charPatchCount = computed(() => countEnabled(currentCharBinding.value));
  const chatPatchCount = computed(() => countEnabled(currentChatBinding.value));

  function ensureCharBinding(): BindingConfigType {
    const key = charKey.value;
    if (!key) throw new Error('No character selected');
    if (!config.value.characters[key]) {
      config.value.characters[key] = { patches: [] };
    }
    return config.value.characters[key];
  }

  function ensureChatBinding(): BindingConfigType {
    const key = chatKey.value;
    if (!key) throw new Error('No chat selected');
    if (!config.value.chats[key]) {
      config.value.chats[key] = { patches: [] };
    }
    return config.value.chats[key];
  }

  function addInlinePatch(level: 'character' | 'chat', patch: Partial<PatchOperation>) {
    const binding = level === 'character' ? ensureCharBinding() : ensureChatBinding();
    const parsed = PatchOperation.parse(patch);
    binding.patches.push({ source: 'inline' as const, patch: parsed });
  }

  function addLibraryRef(level: 'character' | 'chat', entryId: string) {
    const binding = level === 'character' ? ensureCharBinding() : ensureChatBinding();
    binding.patches.push({ source: 'library' as const, entry_id: entryId, enabled: true });
  }

  function removePatch(level: 'character' | 'chat', index: number) {
    const binding = level === 'character' ? currentCharBinding.value : currentChatBinding.value;
    if (binding) binding.patches.splice(index, 1);
  }

  function movePatch(level: 'character' | 'chat', fromIndex: number, toIndex: number) {
    const binding = level === 'character' ? currentCharBinding.value : currentChatBinding.value;
    if (!binding) return;
    const [item] = binding.patches.splice(fromIndex, 1);
    binding.patches.splice(toIndex, 0, item);
  }

  function addLibraryEntry(entry: Partial<LibraryEntry>) {
    config.value.library.push(LibraryEntry.parse(entry));
  }

  function removeLibraryEntry(id: string) {
    const idx = config.value.library.findIndex(e => e.id === id);
    if (idx >= 0) config.value.library.splice(idx, 1);
  }

  function getLibraryEntry(id: string) {
    return config.value.library.find(e => e.id === id) ?? null;
  }

  return {
    config,
    currentCharacter,
    currentChatId,
    charKey,
    chatKey,
    currentCharBinding,
    currentChatBinding,
    charPatchCount,
    chatPatchCount,
    refreshContext,
    ensureCharBinding,
    ensureChatBinding,
    addInlinePatch,
    addLibraryRef,
    removePatch,
    movePatch,
    addLibraryEntry,
    removeLibraryEntry,
    getLibraryEntry,
  };
});

function countEnabled(binding: BindingConfigType | null): number {
  if (!binding) return 0;
  return binding.patches.filter(p =>
    p.source === 'inline' ? p.patch.enabled : p.enabled,
  ).length;
}

useConfigStore(pinia);
