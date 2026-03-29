import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#0b1a10",
          50:  "#f0fdf4",
          100: "#122418",
          200: "#1a3326",
          300: "#1e3d2c",
        },
        brand: {
          DEFAULT: "#22c55e",
          dark:    "#16a34a",
          light:   "#4ade80",
          glow:    "rgba(34,197,94,0.15)",
        },
        yield: {
          DEFAULT: "#f59e0b",
          light:   "#fcd34d",
          bg:      "rgba(245,158,11,0.12)",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(rgba(34,197,94,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.03) 1px, transparent 1px)",
        "hero-gradient":
          "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(34,197,94,0.18) 0%, transparent 70%)",
        "card-gradient":
          "linear-gradient(135deg, rgba(26,51,38,0.6) 0%, rgba(11,26,16,0.8) 100%)",
      },
      backgroundSize: {
        "grid": "40px 40px",
      },
      boxShadow: {
        "glow-sm":  "0 0 20px rgba(34,197,94,0.08)",
        "glow-md":  "0 0 40px rgba(34,197,94,0.12)",
        "glow-lg":  "0 0 60px rgba(34,197,94,0.15)",
        "card":     "0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(26,51,38,0.6)",
        "card-hover": "0 4px 20px rgba(0,0,0,0.5), 0 0 0 1px rgba(34,197,94,0.2), 0 0 30px rgba(34,197,94,0.06)",
      },
      animation: {
        "fade-in":    "fadeIn 0.4s ease-out",
        "slide-up":   "slideUp 0.4s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%":   { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
