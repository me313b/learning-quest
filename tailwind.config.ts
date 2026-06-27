import type { Config } from "tailwindcss";

// Colours mirror PALETTE in src/lib/config.ts so the UI and the logic agree on
// what "diamond" or "grass" means.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        grass: "#5D9C3C",
        grasstop: "#7FB238",
        dirt: "#79553D",
        stone: "#828282",
        sky: "#7EC0EE",
        diamond: "#4AEDD9",
        emerald: "#17DD62",
        redstone: "#E03C28",
        gold: "#F8B617",
        lapis: "#2C4E9C",
        iron: "#D8D8D8",
        obsidian: "#1A1525",
        xp: "#80FF20",
        heart: "#FF3B3B",
        paper: "#F4ECD8",
        ink: "#2A2118",
        panel: "#2C2438",
        paneldark: "#241C2E",
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', "monospace"],
        body: ['"Nunito"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        pixel: "0 6px 0 0 rgba(0,0,0,0.35)",
        pixelsm: "0 3px 0 0 rgba(0,0,0,0.35)",
      },
      keyframes: {
        pop: {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        floaty: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        pop: "pop 180ms ease-out",
        floaty: "floaty 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
