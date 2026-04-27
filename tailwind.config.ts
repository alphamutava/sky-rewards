import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "var(--primary)",
        primaryHover: "var(--primary-hover)",
        bg: "var(--bg)",
        card: "var(--card)",
        card2: "var(--card2)",
        border: "var(--border)",
        border2: "var(--border2)",
        muted: "var(--muted)",
        muted2: "var(--muted2)",
        green: "var(--green)",
        red: "var(--red)",
        yellow: "var(--yellow)",
        blue: "var(--blue)"
      },
      fontFamily: {
        sans: ["var(--font-dm)", "sans-serif"],
        display: ["var(--font-bebas)", "sans-serif"]
      }
    },
  },
  plugins: [],
};
export default config;
