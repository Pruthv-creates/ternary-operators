import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        slate: {
          950: "#0f172a",
          900: "#0f172a",
          850: "#111827",
          800: "#1e293b",
          750: "#1e3a5f",
          700: "#263144",
        },
        accent: {
          blue: "#3b82f6",
          purple: "#8b5cf6",
          green: "#10b981",
          red: "#ef4444",
          yellow: "#f59e0b",
        },
      },
      backgroundImage: {
        "canvas-grid": "linear-gradient(rgba(59,130,246,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,.04) 1px,transparent 1px)",
      },
      backgroundSize: {
        "canvas-grid": "32px 32px",
      },
      boxShadow: {
        "glow-blue": "0 0 20px rgba(59,130,246,.2)",
        "glow-purple": "0 0 20px rgba(139,92,246,.2)",
        "card": "0 4px 24px rgba(0,0,0,.4)",
      },
      animation: {
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "float": "float 3s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
