/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./public/**/*.html",
    "./src/**/*.ts",
  ],
  theme: {
    extend: {
      colors: {
        // Couleurs professionnelles cliniques
        primary: '#1e40af',    // Bleu professionnel
        secondary: '#0ea5e9',  // Bleu ciel
        success: '#10b981',    // Vert
        danger: '#ef4444',     // Rouge
        warning: '#f59e0b',    // Orange
        clinical: '#1e3a8a',   // Bleu très professionnel
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
