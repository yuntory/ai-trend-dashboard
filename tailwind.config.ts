import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        dashboard: {
          bg: "#07090f",
          panel: "#11151f",
          panelSoft: "#171d2a",
          line: "#273043",
          text: "#f5f7fb",
          muted: "#9aa4b2",
          mint: "#2dd4bf",
          coral: "#fb7185",
          amber: "#fbbf24",
          sky: "#38bdf8"
        },
      },
      boxShadow: {
        panel: "0 18px 60px rgba(0, 0, 0, 0.28)",
      },
    },
  },
  plugins: [],
};

export default config;
