import { teleportStyle } from '@util/script';
import { pinia } from '../store';
import PopupApp from './PopupApp.vue';

export async function openManagementPopup(): Promise<void> {
  const $container = $('<div class="persona-tweaker-popup">');
  const app = createApp(PopupApp).use(pinia);
  app.mount($container[0]);

  const { destroy: destroyStyles } = teleportStyle();

  await SillyTavern.callGenericPopup($container[0], SillyTavern.POPUP_TYPE.TEXT, undefined, {
    wide: true,
    wider: true,
    okButton: '关闭',
    leftAlign: true,
    allowVerticalScrolling: true,
    onClose: async () => {
      app.unmount();
      $container.remove();
      destroyStyles();
    },
  });
}
