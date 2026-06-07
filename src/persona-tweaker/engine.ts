import type { PatchOperation, BindingConfig, LibraryEntry, ScriptConfig } from './schema';

function parseRegex(input: string): RegExp | null {
  try {
    const match = input.match(/^\/(.+)\/([gimsuy]*)$/);
    if (match) return new RegExp(match[1], match[2]);
    return new RegExp(_.escapeRegExp(input), 'g');
  } catch {
    return null;
  }
}

export type ResolvedPatch = {
  type: PatchOperation['type'];
  enabled: boolean;
  value: string;
  replacement: string;
  use_regex: boolean;
  label: string;
};

function applyPatch(text: string, patch: ResolvedPatch): string {
  if (!patch.enabled || !patch.value) return text;

  switch (patch.type) {
    case 'append':
      return text + '\n' + substitudeMacros(patch.value);

    case 'prepend':
      return substitudeMacros(patch.value) + '\n' + text;

    case 'delete': {
      if (patch.use_regex) {
        const regex = parseRegex(patch.value);
        if (!regex) return text;
        const global = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : regex.flags + 'g');
        return text.replace(global, '');
      }
      return text.split(patch.value).join('');
    }

    case 'replace': {
      if (patch.use_regex) {
        const regex = parseRegex(patch.value);
        if (!regex) return text;
        const global = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : regex.flags + 'g');
        return text.replace(global, substitudeMacros(patch.replacement));
      }
      return text.split(patch.value).join(substitudeMacros(patch.replacement));
    }
  }
}

export function applyPatches(text: string, patches: ResolvedPatch[]): string {
  return patches.reduce((current, patch) => applyPatch(current, patch), text);
}

export function resolvePatches(binding: BindingConfig, library: LibraryEntry[]): ResolvedPatch[] {
  return binding.patches
    .map((bound): ResolvedPatch | null => {
      if (bound.source === 'inline') {
        return {
          type: bound.patch.type,
          enabled: bound.patch.enabled,
          value: bound.patch.value,
          replacement: bound.patch.replacement ?? '',
          use_regex: bound.patch.use_regex,
          label: bound.patch.label ?? '',
        };
      }
      const entry = library.find(e => e.id === bound.entry_id);
      if (!entry) return null;
      return {
        type: entry.patch.type,
        enabled: bound.enabled && entry.patch.enabled,
        value: entry.patch.value,
        replacement: entry.patch.replacement ?? '',
        use_regex: entry.patch.use_regex,
        label: entry.name || entry.patch.label || '',
      };
    })
    .filter((p): p is ResolvedPatch => p !== null);
}

export function computePatchedPersona(
  originalPersona: string,
  charName: string,
  chatId: string,
  config: ScriptConfig,
): string {
  const charBinding = config.characters[charName];
  const chatBinding = config.chats[`${charName}::${chatId}`];

  let result = originalPersona;
  if (charBinding) {
    result = applyPatches(result, resolvePatches(charBinding, config.library));
  }
  if (chatBinding) {
    result = applyPatches(result, resolvePatches(chatBinding, config.library));
  }
  return result;
}
