import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        fd: {
          red: '#f7323f',
          redDeep: '#d61f2c',
          pink: '#ff8f9f',
          blush: '#ffe3e5',
          ink: '#231815',
          green: '#2e7d4f',
          greenDeep: '#1f5c39',
          mint: '#e3f3e8',
        },
      },
      borderRadius: { glass: '28px' },
      fontFamily: {
        sans: ['"Hiragino Sans"', '"Hiragino Kaku Gothic ProN"', '"Noto Sans JP"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
