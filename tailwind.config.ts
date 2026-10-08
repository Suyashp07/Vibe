import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "var(--brand)",
          mid: "var(--brand-mid)",
          deep: "var(--brand-deep)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          dark: "var(--accent-dark)",
          light: "var(--accent-light)",
        },
        gold: {
          DEFAULT: "var(--gold)",
          light: "var(--gold-light)",
        },
        ink: {
          DEFAULT: "var(--ink)",
          secondary: "var(--ink-secondary)",
          muted: "var(--ink-muted)",
        },
        surface: {
          DEFAULT: "var(--surface)",
          2: "var(--surface-2)",
          3: "var(--surface-3)",
        },
        border: {
          DEFAULT: "var(--border)",
          strong: "var(--border-strong)",
        },
        success: {
          DEFAULT: "var(--success)",
          bg: "var(--success-bg)",
        },
        warning: {
          DEFAULT: "var(--warning)",
          bg: "var(--warning-bg)",
        },
      },
      fontFamily: {
        brand: ["var(--font-outfit)", "Outfit", "var(--font-inter)", "-apple-system", "sans-serif"],
        display: ["var(--font-outfit)", "Outfit", "var(--font-inter)", "-apple-system", "sans-serif"],
        subbrand: ["var(--font-jakarta)", "Plus Jakarta Sans", "var(--font-inter)", "-apple-system", "sans-serif"],
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
