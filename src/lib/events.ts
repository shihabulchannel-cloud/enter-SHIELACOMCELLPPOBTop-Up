// Event bus for real-time website updates when admin changes settings

const STORE_EVENT = 'shielacom:store:update';

export function notifyUpdate(key: string) {
  window.dispatchEvent(new CustomEvent(STORE_EVENT, { detail: key }));
}

export function subscribeToStore(key: string, handler: () => void): () => void {
  const listener = (e: Event) => {
    const evt = e as CustomEvent;
    if (evt.detail === key || evt.detail === '*') handler();
  };
  window.addEventListener(STORE_EVENT, listener);
  return () => window.removeEventListener(STORE_EVENT, listener);
}
