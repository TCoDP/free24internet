import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.js',
        './resources/js/**/*.vue',
    ],

    theme: {
        extend: {
            colors: {
                primary: '#b91c1c',
                'primary-hover': '#991b1b',
                dark: '#111827',
                light: '#f8fafc',
            },
            fontFamily: {
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
            },
            keyframes: {
                'pulse-custom': {
                    '0%, 100%': { boxShadow: '0 0 0 0 rgba(185, 28, 28, 0.7)' },
                    '70%': { boxShadow: '0 0 0 15px rgba(185, 28, 28, 0)' },
                },
                'fade-in': {
                    from: { opacity: '0', transform: 'translateY(10px)' },
                    to: { opacity: '1', transform: 'translateY(0)' },
                },
            },
            animation: {
                'pulse-custom': 'pulse-custom 2s infinite',
                'fade-in': 'fade-in 0.5s',
            },
        },
    },

    plugins: [forms],
};
