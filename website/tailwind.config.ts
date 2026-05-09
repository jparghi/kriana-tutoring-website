import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./data/**/*.{js,ts,jsx,tsx}"
  ],
  safelist: [
    "hover:shadow-[0_12px_40px_rgba(131,197,247,0.35)]",
    "hover:shadow-[0_12px_40px_rgba(249,210,157,0.35)]",
    "hover:shadow-[0_12px_40px_rgba(161,227,216,0.35)]",
    "hover:shadow-[0_12px_40px_rgba(247,172,230,0.35)]",
    "hover:shadow-[0_12px_40px_rgba(159,168,218,0.35)]",
    "hover:shadow-[0_12px_40px_rgba(123,211,234,0.35)]",
    "hover:shadow-[0_12px_40px_rgba(246,214,224,0.35)]",
    "hover:shadow-[0_12px_40px_rgba(99,102,241,0.35)]"
  ],
  theme: {
    extend: {
      colors: {
        brandBlue: "#0EA5E9",
        brandSlate: "#1E293B",
        brand: {
          sky: "#4A90E2",
          teal: "#00B8A9",
          amber: "#FFD166",
          rose: "#FF8A65",
          midnight: "#060B1A"
        }
      },
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
        sans: ["Open Sans", "sans-serif"]
      },
      boxShadow: {
        soft: "0 4px 14px rgba(0,0,0,0.05)",
        glow: "0 8px 24px rgba(14,165,233,0.15)"
      },
      keyframes: {
        "emoji-bounce": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" }
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-22px)" }
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-14px)" }
        },
        "gradient-shift": {
          "0%, 100%": { backgroundPosition: "0% center" },
          "50%": { backgroundPosition: "100% center" }
        },
        shimmer: {
          "0%": { backgroundPosition: "200% center" },
          "100%": { backgroundPosition: "-200% center" }
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.5", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.1)" }
        },
        "ping-slow": {
          "75%, 100%": { transform: "scale(1.8)", opacity: "0" }
        }
      },
      animation: {
        "emoji-bounce": "emoji-bounce 1.5s ease-in-out infinite",
        float: "float 7s ease-in-out infinite",
        "float-slow": "float-slow 10s ease-in-out infinite",
        "float-delayed": "float 7s ease-in-out 3.5s infinite",
        "gradient-shift": "gradient-shift 5s ease-in-out infinite",
        shimmer: "shimmer 2.5s linear infinite",
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
        "ping-slow": "ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite"
      }
    }
  },
  plugins: []
};

export default config;
