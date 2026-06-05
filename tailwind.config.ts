import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					glow: 'hsl(var(--primary-glow))',
					dark: 'hsl(var(--primary-dark))',
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				brand: {
					dark: 'hsl(var(--brand-dark))',
					green: 'hsl(var(--brand-green))',
					'green-light': 'hsl(var(--brand-green-light))',
					'green-dark': 'hsl(var(--brand-green-dark))',
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
				xl: 'calc(var(--radius) + 4px)',
				'2xl': 'calc(var(--radius) + 8px)',
			},
			fontFamily: {
				sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
			},
			boxShadow: {
				'green': '0 10px 40px -10px hsl(142 71% 45% / 0.4)',
				'green-lg': '0 20px 60px -10px hsl(142 71% 45% / 0.3)',
				'green-glow': '0 0 40px hsl(142 71% 45% / 0.3)',
				'card': '0 4px 24px -4px hsl(222 47% 11% / 0.1)',
				'card-hover': '0 20px 60px -10px hsl(142 71% 45% / 0.2)',
				'glass': '0 8px 32px rgba(0, 0, 0, 0.1)',
				'neon': '0 0 15px hsl(142 71% 45% / 0.5), 0 0 30px hsl(142 71% 45% / 0.3)',
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'fade-up': {
					from: { opacity: '0', transform: 'translateY(30px)' },
					to: { opacity: '1', transform: 'translateY(0)' }
				},
				'fade-in': {
					from: { opacity: '0' },
					to: { opacity: '1' }
				},
				'slide-right': {
					from: { opacity: '0', transform: 'translateX(-30px)' },
					to: { opacity: '1', transform: 'translateX(0)' }
				},
				'scale-in': {
					from: { opacity: '0', transform: 'scale(0.85)' },
					to: { opacity: '1', transform: 'scale(1)' }
				},
				'pulse-glow': {
					'0%, 100%': { boxShadow: '0 0 20px hsl(142 71% 45% / 0.4)' },
					'50%': { boxShadow: '0 0 40px hsl(142 71% 45% / 0.8), 0 0 80px hsl(142 71% 45% / 0.3)' }
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-8px)' }
				},
				'shimmer': {
					'0%': { backgroundPosition: '-200% center' },
					'100%': { backgroundPosition: '200% center' }
				},
				'ripple': {
					'0%': { transform: 'scale(0)', opacity: '1' },
					'100%': { transform: 'scale(4)', opacity: '0' }
				},
				'spin-slow': {
					from: { transform: 'rotate(0deg)' },
					to: { transform: 'rotate(360deg)' }
				},
				'bounce-gentle': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-4px)' }
				},
				'wa-pulse': {
					'0%': { boxShadow: '0 0 0 0 hsl(142 71% 45% / 0.7)' },
					'70%': { boxShadow: '0 0 0 15px hsl(142 71% 45% / 0)' },
					'100%': { boxShadow: '0 0 0 0 hsl(142 71% 45% / 0)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-up': 'fade-up 0.6s ease-out forwards',
				'fade-in': 'fade-in 0.5s ease-out forwards',
				'slide-right': 'slide-right 0.6s ease-out forwards',
				'scale-in': 'scale-in 0.5s ease-out forwards',
				'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
				'float': 'float 3s ease-in-out infinite',
				'shimmer': 'shimmer 3s linear infinite',
				'ripple': 'ripple 0.6s linear forwards',
				'spin-slow': 'spin-slow 8s linear infinite',
				'bounce-gentle': 'bounce-gentle 2s ease-in-out infinite',
				'wa-pulse': 'wa-pulse 2s ease-out infinite',
			},
			backgroundImage: {
				'hero-gradient': 'linear-gradient(135deg, hsl(222 47% 8%) 0%, hsl(142 71% 15%) 50%, hsl(222 47% 11%) 100%)',
				'green-gradient': 'linear-gradient(135deg, hsl(142 71% 45%), hsl(142 71% 35%))',
				'green-gradient-soft': 'linear-gradient(135deg, hsl(142 71% 45% / 0.1), hsl(142 71% 35% / 0.05))',
				'card-gradient': 'linear-gradient(145deg, hsl(0 0% 100%), hsl(142 30% 97%))',
				'dark-gradient': 'linear-gradient(135deg, hsl(222 47% 11%), hsl(222 47% 8%))',
			},
		}
	},
	plugins: [tailwindcssAnimate],
} satisfies Config;
