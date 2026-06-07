import { createScriptIdDiv, teleportStyle } from '@util/script';
import { pinia } from '../store';
import Widget from './Widget.vue';

export function injectWidget(): { destroy: () => void } {
  const app = createApp(Widget).use(pinia);

  const $widget = createScriptIdDiv();

  const $personaDesc = $('#persona_description');
  if ($personaDesc.length) {
    const $parent = $personaDesc.closest('.flex-container, div').first();
    $widget.insertAfter($parent);
  } else {
    $widget.appendTo('#user_settings_block');
  }

  app.mount($widget[0]);
  const { destroy: destroyStyles } = teleportStyle();

  return {
    destroy: () => {
      app.unmount();
      $widget.remove();
      destroyStyles();
    },
  };
}
