"use client";

import { useEffect, useState } from "react";

/** Registers the service worker (reminders and the offline page) once the app has loaded. Renders nothing. */
export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    // After load, so it never competes with the page for the network. A failure only means no reminders.
    const register = () => navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {});
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);
  return null;
}

/** The event Chrome on Android fires when the app can be installed. It is not in lib.dom, so it is typed here. */
type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

/**
 * Lets the account menu offer "Instalar o app" on Android. `install` is null when the app cannot be installed from
 * here: already installed, a browser that does not offer it, or the event has not fired yet.
 */
export function useInstall() {
  const [event, setEvent] = useState<InstallEvent | null>(null);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault(); // keep the browser's own mini-bar out of the way; the menu item is the invitation
      setEvent(e as InstallEvent);
    };
    const onInstalled = () => setEvent(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!event) return null;
  return async () => {
    await event.prompt();
    await event.userChoice;
    setEvent(null); // a prompt can only be used once
  };
}

/** True when the app is running installed (from the home screen) rather than in a browser tab. */
export function isInstalled(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches;
}
