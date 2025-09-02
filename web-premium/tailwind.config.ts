import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

const config: Config = {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: 'var(--color-cream)',
        brown: 'var(--color-brown)',
        gold: 'var(--color-gold)',
        'light-gold': 'var(--color-light-gold)',
        'dark-brown': 'var(--color-dark-brown)',
        white: 'var(--color-white)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', ...defaultTheme.fontFamily.sans],
        serif: ['var(--font-playfair-display)', ...defaultTheme.fontFamily.serif],
      },
    },
  },
  plugins: [],
};

export default config;
