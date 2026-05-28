/** 本番ビルド時だけ、load 後に PWA 用 service worker を登録する。 */
export const registerServiceWorker = (): void => {
  if (!('serviceWorker' in navigator)) return;
  if (import.meta.env.DEV) return;

  window.addEventListener('load', () => {
    void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch((error) => {
      window.dispatchEvent(
        new ErrorEvent('error', {
          error,
          message: 'Service worker registration failed',
        }),
      );
    });
  });
};
