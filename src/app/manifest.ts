import type { MetadataRoute } from "next";

// App Router manifest. Next.js serves this at /manifest.webmanifest and injects
// the <link rel="manifest"> automatically, so the app is installable as a
// standalone PWA on iPad, iPhone, Mac and desktop.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Learning Quest",
    short_name: "Learning Quest",
    description:
      "Mine knowledge. Build a brilliant brain. A daily, adaptive learning adventure for young explorers.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#241c2e",
    theme_color: "#241c2e",
    categories: ["education", "kids"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
