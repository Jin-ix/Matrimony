/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                gold: {
                    50: '#fbf9f1',
                    100: '#f5f0db',
                    200: '#eadcae',
                    300: '#dfc27a',
                    400: '#d5a84b',
                    500: '#cc8e2d',
                    600: '#b16f21',
                    700: '#8f531d',
                    800: '#77431e',
                    900: '#64371b',
                    950: '#3a1c0d',
                },
                rose: {
                    50: '#fff1f2',
                    100: '#ffe4e6',
                    200: '#fecdd3',
                    300: '#fda4af',
                    400: '#fb7185',
                    500: '#f43f5e',
                    600: '#e11d48',
                    700: '#be123c',
                    800: '#9f1239',
                    900: '#881337',
                    950: '#4c0519',
                },
                sacred: {
                    white: '#ffffff',
                    offwhite: '#FDFCFB',
                    dark: '#0f172a', // Deep elegant navy/charcoal replacing the dark red
                    midnight: '#0B0F19', // The signature dark mode foundation
                    brand: '#d5a84b', // Gold base
                },
                pearl: {
                    50: '#FDFCFB',
                    100: '#FBF9F6',
                    200: '#F5F1E8',
                    300: '#EBE2D3',
                    400: '#DFCDB7',
                    500: '#D2B69A',
                    600: '#C29F80',
                    700: '#AE8B6F',
                    800: '#937660',
                    900: '#796251',
                    950: '#40332B',
                }
            },
            fontFamily: {
                serif: ['"Playfair Display"', 'Georgia', 'serif'], // Elegant serif for Christian Marriage theme
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            animation: {
                'fluid-spring': 'fluid 3s ease-in-out infinite',
                'curtain-reveal': 'curtain 1.5s cubic-bezier(0.77, 0, 0.175, 1) forwards',
                'ripple': 'ripple 1s cubic-bezier(0, 0.2, 0.8, 1) forwards',
                'divine-glow': 'glow 4s ease-in-out infinite',
                'float-slow': 'float 6s ease-in-out infinite',
                'fade-in': 'fadeIn 1s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                'shimmer': 'shimmer 2s infinite linear',
            },
            keyframes: {
                fluid: {
                    '0%, 100%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.05)' },
                },
                curtain: {
                    '0%': { transform: 'translateY(100%)' },
                    '100%': { transform: 'translateY(0)' },
                },
                ripple: {
                    '0%': { transform: 'scale(0.8)', opacity: '1' },
                    '100%': { transform: 'scale(2.5)', opacity: '0' },
                },
                glow: {
                    '0%, 100%': { opacity: '0.8', filter: 'brightness(1)' },
                    '50%': { opacity: '1', filter: 'brightness(1.2)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                fadeIn: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                shimmer: {
                    '0%': { transform: 'translateX(-100%)' },
                    '100%': { transform: 'translateX(100%)' },
                }
            }
        },
    },
    plugins: [],
}
