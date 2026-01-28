/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: ["./src/**/*.{ts,tsx}"],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Geist', 'system-ui', 'sans-serif'],
                mono: ['Geist Mono', 'SF Mono', 'monospace'],
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)'
            },
            colors: {
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))'
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))'
                },
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))'
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))'
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))'
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))'
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))'
                },
                success: {
                    DEFAULT: 'hsl(var(--success))',
                    foreground: 'hsl(var(--success-foreground))',
                    muted: 'hsl(var(--success-muted))'
                },
                warning: {
                    DEFAULT: 'hsl(var(--warning))',
                    foreground: 'hsl(var(--warning-foreground))',
                    muted: 'hsl(var(--warning-muted))'
                },
                info: {
                    DEFAULT: 'hsl(var(--info))',
                    foreground: 'hsl(var(--info-foreground))',
                    muted: 'hsl(var(--info-muted))'
                },
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                chart: {
                    '1': 'hsl(var(--chart-1))',
                    '2': 'hsl(var(--chart-2))',
                    '3': 'hsl(var(--chart-3))',
                    '4': 'hsl(var(--chart-4))',
                    '5': 'hsl(var(--chart-5))'
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
            boxShadow: {
                'xs': 'var(--shadow-xs)',
                'card': 'var(--shadow-card)',
                'card-hover': 'var(--shadow-card-hover)',
                'glow-primary': 'var(--shadow-glow-primary)',
                'glow-success': 'var(--shadow-glow-success)',
                'glow-warning': 'var(--shadow-glow-warning)',
            },
            animation: {
                'fade-in': 'fade-in 0.4s ease-out forwards',
                'fade-in-up': 'fade-in-up 0.4s ease-out forwards',
                'fade-in-down': 'fade-in-down 0.4s ease-out forwards',
                'scale-in': 'scale-in 0.3s ease-out forwards',
                'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
                'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
                'shimmer': 'shimmer 2s infinite',
                'bounce-subtle': 'bounce-subtle 2s ease-in-out infinite',
            },
            transitionDuration: {
                'fast': '150ms',
                'base': '200ms',
                'slow': '300ms',
            },
            transitionTimingFunction: {
                'bounce': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
            }
        }
    },
    plugins: [require("tailwindcss-animate")],
}

