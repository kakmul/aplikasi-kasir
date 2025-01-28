/** @type {import('tailwindcss').Config} */
    export default {
      content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
      theme: {
        extend: {
          colors: {
            'custom-blue': 'rgb(7, 99, 235)',
          },
        },
      },
      plugins: [],
    };
