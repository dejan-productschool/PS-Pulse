import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0f1729",
          soft: "#475467",
          faint: "#98a2b3",
        },
        surface: {
          DEFAULT: "#ffffff",
          muted: "#f7f8fa",
          sunken: "#f1f2f5",
        },
        line: "#e4e7ec",
        brand: {
          DEFAULT: "#3b5bdb",
          soft: "#edf0fe",
        },
        status: {
          ontrack: "#12b76a",
          ontrackSoft: "#e7f8ef",
          atrisk: "#f79009",
          atriskSoft: "#fef4e6",
          offtrack: "#f04438",
          offtrackSoft: "#fdeceb",
          notstarted: "#667085",
          notstartedSoft: "#f1f2f5",
          paused: "#7a5af8",
          pausedSoft: "#f0edfe",
          done: "#1570ef",
          doneSoft: "#e9f1fe",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,0.06), 0 1px 3px rgba(16,24,40,0.04)",
        pop: "0 4px 12px rgba(16,24,40,0.08), 0 2px 4px rgba(16,24,40,0.04)",
      },
      borderRadius: {
        xl: "0.875rem",
      },
    },
  },
  plugins: [],
};

export default config;
