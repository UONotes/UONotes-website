import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          red: '#8F0018',
          'red-hover': '#6e0012',
          dark: '#2A2A2A',
          body: '#454545',
          muted: '#80746C',
          surface: '#F5F5F5',
          pink: '#FFF0F0',
          border: '#80746C',
          'border-light': '#E0E0E0',
        }
      },
      fontFamily: {
        logo: ['var(--font-logo)', 'serif'],
      },
      maxWidth: {
        'site': '1400px',
      }
    },
  },
  plugins: [],
};
export default config;