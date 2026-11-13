import type { MetadataRoute } from "next";

/** What Android reads to install Aura to the home screen: it opens on Hoje, without the browser's bars. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Aura",
    short_name: "Aura",
    description: "Fique perto do que importa.",
    lang: "pt-BR",
    start_url: "/hoje",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F6F3EE",
    theme_color: "#F6F3EE",
    icons: [
      { src: "/pwa-icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/maskable", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Rotina de hoje", short_name: "Hoje", url: "/hoje" },
      { name: "Escrever uma reflexão", short_name: "Escrever", url: "/refletir/escrever" },
    ],
  };
}
