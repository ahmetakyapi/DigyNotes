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
          DEFAULT: "rgb(var(--gold-rgb) / <alpha-value>)",
          light: "rgb(var(--gold-light-rgb) / <alpha-value>)",
          dark: "var(--gold-dark)",
        },
        accent: {
          DEFAULT: "rgb(var(--gold-rgb) / <alpha-value>)",
          light: "rgb(var(--gold-light-rgb) / <alpha-value>)",
          dark: "var(--gold-dark)",
          2: "rgb(var(--accent-2-rgb) / <alpha-value>)",
        },
        ink: "rgb(var(--ink-rgb) / <alpha-value>)",
        dn: {
          bg: {
            base: "var(--bg-base)",
            card: "var(--bg-card)",
            raised: "var(--bg-raised)",
            header: "var(--bg-header)",
            soft: "var(--bg-soft)",
          },
          border: {
            DEFAULT: "var(--border)",
            subtle: "var(--border-subtle)",
            header: "var(--border-header)",
          },
          text: {
            primary: "var(--text-primary)",
            secondary: "var(--text-secondary)",
            muted: "var(--text-muted)",
          },
          accent: {
            DEFAULT: "rgb(var(--gold-rgb) / <alpha-value>)",
            light: "rgb(var(--gold-light-rgb) / <alpha-value>)",
            dark: "var(--gold-dark)",
          },
          danger: "var(--danger)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        display: ["var(--font-display)"],
        mono: ["var(--font-mono)"],
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      opacity: {
        3: "0.03",
        4: "0.04",
        6: "0.06",
        8: "0.08",
        12: "0.12",
        14: "0.14",
        16: "0.16",
        18: "0.18",
        22: "0.22",
        24: "0.24",
        35: "0.35",
        45: "0.45",
        55: "0.55",
        65: "0.65",
      },
      fontSize: {
        "2xs": ["0.65rem", { lineHeight: "1rem" }],
      },
      borderRadius: {
        card: "0.75rem",
        modal: "1rem",
      },
      boxShadow: {
        "accent-sm": "0 0 0 1px rgb(var(--gold-rgb) / 0.25), 0 6px 18px -6px rgb(var(--gold-rgb) / 0.3)",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
} satisfies Config;
