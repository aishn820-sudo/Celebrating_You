import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#121212',
          surface: '#1B1B1B',
          elevated: '#242424',
          muted: '#2B2728',
          border: '#393234',
          text: {
            primary: '#F5F0EB',
            secondary: '#B8ADA6',
          },
          accent: {
            DEFAULT: '#F47291',
            hover: '#FB91A8',
          },
        },
        warm: {
          50: '#FDFBF7',
          100: '#F7F5F0',
          200: '#EFECE6',
          300: '#E4DFD7',
          400: '#D5CEC3',
          500: '#B8AF9F',
        },
        charcoal: {
          50: '#F6F6F6',
          100: '#E7E7E7',
          200: '#D1D1D1',
          300: '#B0B0B0',
          400: '#888888',
          500: '#6D6D6D',
          600: '#5D5D5D',
          700: '#4F4F4F',
          800: '#292524',
          900: '#1C1917',
          950: '#0C0A09',
        },
        primary: {
          50: '#FFF1F2',
          100: '#FFE4E6',
          200: '#FECDD3',
          300: '#FDA4AF',
          400: '#FB7185',
          500: '#F43F5E',
          600: '#E11D48',
          700: '#BE123C',
          800: '#9F1239',
          900: '#881337',
          950: '#4C0519',
        },
        champagne: {
          50: '#FBF8F2',
          100: '#F6EFE0',
          200: '#ECDFC2',
          300: '#DFCCA0',
          400: '#D0B57E',
          500: '#C29F5F',
          600: '#A98348',
          700: '#8A6638',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
        serif: [
          'Playfair Display',
          'Georgia',
          'Cambria',
          '"Times New Roman"',
          'Times',
          'serif',
        ],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02)',
        'premium': '0 10px 30px -5px rgba(28, 25, 23, 0.08), 0 4px 6px -2px rgba(28, 25, 23, 0.03)',
      },
    },
  },
  plugins: [],
};

export default config;
