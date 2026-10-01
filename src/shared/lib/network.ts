/** Network edge cases shared by autosave and buttons: no connection, a server that does not answer. */

/** How long a save or an action may take before the user is told the server is not answering. */
export const REQUEST_TIMEOUT_MS = 15_000;
/** After this long a save still in flight is shown as slow, so a long wait never looks like a hang. */
export const SLOW_MS = 3_000;

export class TimeoutError extends Error {
  constructor() {
    super("timeout");
    this.name = "TimeoutError";
  }
}

/** Rejects with TimeoutError when the promise has not settled in `ms`. The request itself keeps running. */
export function withTimeout<T>(promise: Promise<T>, ms = REQUEST_TIMEOUT_MS): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new TimeoutError()), ms);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); },
    );
  });
}

/** True when the browser knows it has no connection. On the server it is always online. */
export const isOffline = () => typeof navigator !== "undefined" && navigator.onLine === false;

/** Delay before the n-th automatic retry (n from 1): 3 s, 6 s, 12 s, then every 30 s. */
export const retryDelay = (n: number) => Math.min(3_000 * 2 ** (n - 1), 30_000);
