import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-dark': '#0f0f23',
        'bg-card': '#1a1a2e',
        'primary': '#00ff88',
        'secondary': '#ff2e63',
        'accent': '#08d9d6',
      },
    },
  },
  plugins: [],
};

export default config;
