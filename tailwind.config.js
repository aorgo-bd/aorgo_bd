/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      spacing: {
        "4.5": "1.125rem",
        "5.5": "1.375rem",
      },
      scale: {
        "98": "0.98",
        "102": "1.02",
      },
      boxShadow: {
        "xs": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        "2xs": "0 1px 1px 0 rgb(0 0 0 / 0.03)",
      },
      animation: {
        "fade-in": "fadeIn 200ms ease-out",
        "scale-in": "scaleIn 150ms ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      colors: {
        pink: {
          50: "#FFE6EE",
          100: "#FFCCDC",
          200: "#FF99B9",
          300: "#FF6D97",
          400: "#FF5482",
          500: "#FF3F6C",
          600: "#E51F4D",
          700: "#C2143C",
          800: "#8F0E2C",
          900: "#5C091C",
          950: "#3A0512",
        },
        ink: {
          50: "#FAFBFC",
          100: "#F5F5F6",
          200: "#EAEAEC",
          300: "#D4D5D9",
          400: "#94969F",
          500: "#535766",
          700: "#282C3F",
          900: "#14133B",
        },
        discount: "#FF3333",
        ratingGreen: "#03A685",
        "brand-orange": "#FF905A",
        "brand-yellow": "#FFD93D",
        "brand-green": "#03A685",
        gray: {
          150: "#e5e7eb",
          250: "#d9dde3",
          350: "#b8c0cc",
          450: "#7b8493",
          550: "#596273",
          305: "#d1d5db",
          750: "#374151",
        },
        slate: {
          150: "#e2e8f0",
          250: "#cbd5e1",
          350: "#94a3b8",
          450: "#64748b",
          550: "#475569",
          650: "#334155",
          850: "#172033",
        },
        zinc: {
          150: "#e4e4e7",
          350: "#a1a1aa",
          750: "#3f3f46",
          850: "#27272a",
        },
        red: {
          150: "#fecaca",
          450: "#f87171",
          650: "#dc2626",
        },
        violet: {
          650: "#7c3aed",
          750: "#5b21b6",
        },
        indigo: {
          150: "#c7d2fe",
          650: "#4f46e5",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Assistant", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Whitney", "Inter", "sans-serif"],
        bangla: ["var(--font-bangla)", "Hind Siliguri", "Assistant", "sans-serif"],
      },
      transitionTimingFunction: {
        myntra: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
