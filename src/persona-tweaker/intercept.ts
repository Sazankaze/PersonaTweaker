import { computePatchedPersona } from './engine';
import { pinia, useConfigStore } from './store';

let cachedRawPersona = '';

export async function refreshPersonaCache(): Promise<void> {
  try {
    cachedRawPersona = ($('#persona_description').val() as string) ?? '';
  } catch {
    cachedRawPersona = '';
    console.warn('[persona-tweaker] Failed to read persona description');
  }
}

eventOn(tavern_events.GENERATE_AFTER_DATA, (generate_data, dry_run) => {
  const charName = getCurrentCharacterName();
  if (!charName || !cachedRawPersona) return;

  const store = useConfigStore(pinia);
  const chatId = SillyTavern.getCurrentChatId();
  const charKey = charName;
  const chatKey = `${charName}::${chatId}`;

  if (!store.config.characters[charKey] && !store.config.chats[chatKey]) return;

  const expandedPersona = substitudeMacros(cachedRawPersona);
  if (!expandedPersona) return;

  const patched = computePatchedPersona(expandedPersona, charName, chatId, store.config);
  if (patched === expandedPersona) return;

  for (const msg of generate_data.prompt) {
    if (typeof msg.content === 'string' && msg.content.includes(expandedPersona)) {
      msg.content = msg.content.replace(expandedPersona, patched);
      console.info('[persona-tweaker] Persona patched in prompt');
      return;
    }
    if (Array.isArray(msg.content)) {
      for (const part of msg.content) {
        if (part.type === 'text' && part.text.includes(expandedPersona)) {
          part.text = part.text.replace(expandedPersona, patched);
          console.info('[persona-tweaker] Persona patched in prompt (content array)');
          return;
        }
      }
    }
  }

  console.warn('[persona-tweaker] Could not find persona text in prompt');
});
