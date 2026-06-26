import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#185FA5',
          'blue-mid': '#378ADD',
          'blue-lt': '#E6F1FB',
          'blue-dk': '#0C447C',
          teal: '#0F6E56',
          'teal-lt': '#E1F5EE',
          amber: '#854F0B',
          'amber-lt': '#FAEEDA',
          green: '#27500A',
          'green-lt': '#EAF3DE',
        },
        ui: {
          text: '#1A1917',
          'text-sec': '#5F5E5A',
          'text-ter': '#8A8880',
          border: '#D8D6CF',
          bg: '#F7F6F2',
        },
      },
      borderRadius: {
        card: '16px',
        pill: '9999px',
      },
      maxWidth: {
        sm: '24rem',
      },
    },
  },
  plugins: [],
}

export default config
