/**
 * Helpers shared by the browser and the server for Web Push. No secrets and no server-only imports here.
 */

/** The browser wants the public VAPID key as bytes; it is stored and sent as URL-safe base64. */
export function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

/**
 * The push services browsers actually use. The server POSTs a notification to whatever address a device registers,
 * and that address comes from the browser, so anything outside this list is refused: otherwise a signed-in person
 * could make the server send requests to any host they like.
 */
export function isKnownPushEndpoint(endpoint: string): boolean {
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" || url.port !== "" || url.username || url.password) return false;
  const host = url.hostname.toLowerCase();
  return (
    host === "fcm.googleapis.com" || // Chrome and other Chromium browsers, Android
    host === "updates.push.services.mozilla.com" || // Firefox
    host.endsWith(".push.services.mozilla.com") ||
    host.endsWith(".push.apple.com") || // Safari
    host.endsWith(".notify.windows.com") // Edge
  );
}
