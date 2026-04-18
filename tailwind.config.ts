import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: "#10b981",
          light: "#34d399",
          dark: "#059669",
        },
        dn: {
          bg: {
            base: "#0a0f1e",
            card: "#101828",
            raised: "#182036",
            header: "#080d1a",
            soft: "#0e1626",
          },
          border: {
            DEFAULT: "#1e3044",
            subtle: "#182840",
            header: "#162236",
          },
          text: {
            primary: "#ecf2ff",
            secondary: "#94a8c8",
            muted: "#6b7f9e",
          },
          accent: {
            DEFAULT: "#10b981",
            light: "#34d399",
            dark: "#059669",
          },
          danger: "#e53e3e",
        },
      },
      fontSize: {
        "2xs": ["0.65rem", { lineHeight: "1rem" }],
      },
      borderRadius: {
        card: "0.75rem",
        modal: "1rem",
      },
      boxShadow: {
        "accent-sm": "0 0 0 1px rgba(16,185,129,0.2), 0 2px 8px rgba(16,185,129,0.1)",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
} satisfies Config;
