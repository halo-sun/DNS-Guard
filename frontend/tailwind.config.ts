import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        canvas: "var(--color-canvas, #010102)",
        surface: {
          1: "var(--color-surface-1, #0f1011)",
          2: "var(--color-surface-2, #141516)",
          3: "var(--color-surface-3, #18191a)",
          4: "var(--color-surface-4, #191a1b)",
        },
        primary: {
          DEFAULT: "var(--color-primary, #5e6ad2)",
          hover: "var(--color-primary-hover, #828fff)",
          focus: "var(--color-primary-focus, #5e69d1)",
        },
        ink: {
          DEFAULT: "var(--color-ink, #f7f8f8)",
          muted: "var(--color-ink-muted, #d0d6e0)",
          subtle: "var(--color-ink-subtle, #8a8f98)",
          tertiary: "var(--color-ink-tertiary, #62666d)",
        },
        hairline: {
          DEFAULT: "var(--color-hairline, #23252a)",
          strong: "var(--color-hairline-strong, #34343a)",
          tertiary: "var(--color-hairline-tertiary, #3e3e44)",
        },
        severity: {
          low: "var(--color-severity-low, #27a644)",
          medium: "var(--color-severity-medium, #f59e0b)",
          high: "var(--color-severity-high, #ea580c)",
          critical: "var(--color-severity-critical, #dc2626)",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      borderRadius: {
        sm: "4px",
        md: "6px",
        lg: "8px",
        xl: "12px",
      },
    },
  },
  plugins: [],
} satisfies Config;
