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
        primary: {
          DEFAULT: "#3B82F6",
          dark: "#2563EB",
        },
        secondary: {
          DEFAULT: "#8B5CF6",
          dark: "#7C3AED",
        },
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444",
        surface: "#F9FAFB",
        line: "#E5E7EB",
        ink: {
          DEFAULT: "#111827",
          secondary: "#6B7280",
        },
      },
    },
  },
  plugins: [],
};

export default config;
