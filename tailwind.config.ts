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
          DEFAULT: "#0A0A0A",
          mid: "#171717",
          deep: "#000000",
        },
        accent: {
          DEFAULT: "#E8621A",
          dark: "#C84E0E",
          light: "#FFF1E8",
        },
        gold: {
          DEFAULT: "#D97706",
          light: "#FEF3C7",
        },
        ink: {
          DEFAULT: "#0A0A0A",
          secondary: "#525252",
          muted: "#737373",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          2: "#F8FAFC",
          3: "#F1F5F9",
        },
        border: {
          DEFAULT: "#E2E8F0",
          strong: "#CBD5E1",
        },
        success: {
          DEFAULT: "#16A34A",
          bg: "#DCFCE7",
        },
        warning: {
          DEFAULT: "#D97706",
          bg: "#FEF3C7",
        },
      },
      fontFamily: {
        display: ["var(--font-inter)", "Inter", "-apple-system", "sans-serif"],
        tagline: ["var(--font-inter)", "Inter", "-apple-system", "sans-serif"],
        sans: ["var(--font-inter)", "Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      borderRadius: {
        btn: "12px",
        input: "10px",
        card: "20px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.04), 0 6px 18px rgba(0,0,0,0.03)",
        elevated: "0 12px 32px rgba(0,0,0,0.08)",
        hover: "0 14px 36px rgba(0,0,0,0.12)",
      },
    },
  },
  plugins: [],
};
export default config;
