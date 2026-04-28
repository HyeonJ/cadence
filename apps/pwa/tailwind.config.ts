import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        ink: "var(--ink)",
        "ink-secondary": "var(--ink-secondary)",
        "ink-2": "var(--ink-2)",
        muted: "var(--muted)",
        sub: "var(--sub)",
        hairline: "var(--hairline)",
        "hairline-strong": "var(--hairline-strong)",
        "card-line": "var(--card-line)",
        primary: "var(--primary)",
        "primary-soft": "var(--primary-soft)",
        cobalt: "var(--cobalt)",
        "sky-50": "var(--sky-50)",
        "sky-100": "var(--sky-100)",
        "sky-200": "var(--sky-200)",
        "ring-input": "var(--ring-input)",
        "ring-build": "var(--ring-build)",
        "ring-share": "var(--ring-share)",
        "ring-track": "var(--ring-track)",
        "cell-empty": "var(--cell-empty)",
        "cell-1": "var(--cell-1)",
        "cell-2": "var(--cell-2)",
        "cell-3": "var(--cell-3)",
        danger: "var(--danger)",
      },
      borderRadius: {
        DEFAULT: "6px",
        data: "14px",
        cell: "8px",
      },
      fontFamily: {
        display: ["var(--font-display)", "Inter", "Pretendard", "sans-serif"],
        body: ["var(--font-body)", "Inter", "Pretendard", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.04)",
      },
      letterSpacing: {
        display: "-0.04em",
        pill: "0.06em",
        "pill-strong": "0.12em",
      },
      fontSize: {
        pill: ["11px", { letterSpacing: "0.06em" }],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
