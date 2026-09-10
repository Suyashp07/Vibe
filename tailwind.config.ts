import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#1A1A2E",
          mid: "#16213E",
          deep: "#0F3460",
        },
        accent: {
          DEFAULT: "#E8621A",
          dark: "#D45510",
          light: "#FEF0E7",
        },
        gold: {
          DEFAULT: "#C9A84C",
          light: "#FDF6E7",
        },
        ink: {
          DEFAULT: "#0F0F0F",
          secondary: "#4B4B4B",
          muted: "#8A8A8A",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          2: "#F9F7F4", // warm parchment
          3: "#F0EDE8",
        },
        border: {
          DEFAULT: "#E8E4DF",
          strong: "#C8C4BF",
        },
        success: {
          DEFAULT: "#1A7A4A",
          bg: "#E8F5EE",
        },
        warning: {
          DEFAULT: "#B45309",
          bg: "#FEF3C7",
        },
      },
      fontFamily: {
        display: ["var(--font-playfair)", "Playfair Display", "Georgia", "serif"],
        tagline: ["var(--font-fraunces)", "Fraunces", "Georgia", "serif"],
        sans: ["var(--font-inter)", "Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      borderRadius: {
        btn: "10px",
        input: "8px",
        card: "16px",
      },
      boxShadow: {
        card: "0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
        elevated: "0 8px 24px rgba(0,0,0,0.10)",
        hover: "0 12px 32px rgba(26,26,46,0.18)",
      },
    },
  },
  plugins: [],
};
export default config;
