import type {Config} from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        body: ['Roboto', 'Arial', 'sans-serif'],
        headline: ['Roboto', 'Arial', 'sans-serif'],
        sans: ['Roboto', 'Arial', 'sans-serif'],
        code: ['monospace'],
      },
      colors: {
        // Creative Warm Orange colors
        'brand-orange': {
          DEFAULT: '#FF6B00',
          50: '#FFE9D6',
          100: '#FFD9B8',
          200: '#FFB87D',
          300: '#FF9742',
          400: '#FF8121',
          500: '#FF6B00',
          600: '#E65A00',
          700: '#B84700',
          800: '#8A3500',
          900: '#5C2300',
        },
        'warm-gray': {
          50: '#f8f8f8',
          100: '#f2f2f2',
          200: '#f0f0f0',
          300: '#e0e0e0',
          400: '#909090',
          500: '#606060',
          600: '#404040',
          700: '#282828',
          800: '#181818',
          900: '#0f0f0f',
        },
        // Keep existing custom colors for compatibility
        'soft-blue': {
          DEFAULT: '#4A90E2',
          50: '#E8F2FC',
          100: '#D1E5F9',
          200: '#A3CBF3',
          300: '#75B1ED',
          400: '#4A90E2',
          500: '#2E7DD3',
          600: '#2563A8',
          700: '#1C4A7D',
          800: '#133052',
          900: '#0A1627',
        },
        'soft-green': {
          DEFAULT: '#50E3C2',
          50: '#E9FBF7',
          100: '#D3F7EF',
          200: '#A7EFDF',
          300: '#7BE7CF',
          400: '#50E3C2',
          500: '#2FD4AD',
          600: '#25A989',
          700: '#1B7E65',
          800: '#115341',
          900: '#08291D',
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
