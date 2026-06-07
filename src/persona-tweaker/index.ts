import { reloadOnChatChange } from '@util/script';
import './intercept';
import { refreshPersonaCache } from './intercept';
import { pinia, useConfigStore } from './store';
import { injectWidget } from './ui/widget';

reloadOnChatChange();

$(() => {
  errorCatched(async () => {
    await refreshPersonaCache();

    const store = useConfigStore(pinia);
    store.refreshContext();

    const widget = injectWidget();

    $(window).on('pagehide', () => {
      widget.destroy();
    });

    console.info('[persona-tweaker] Initialized');
  })();
});
