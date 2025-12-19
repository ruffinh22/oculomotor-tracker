#!/bin/bash
# Script de compilation pour production

echo "🔨 Compilation du projet..."

# 1. Compiler TypeScript
echo "📝 Compilation TypeScript..."
npx tsc --noEmit || true

# 2. Générer le CSS Tailwind avec PostCSS
echo "🎨 Génération du CSS Tailwind..."
npx postcss -i ./src/globals.css -o ./public/styles-tailwind.css

# 3. Bundler l'app avec esbuild
echo "📦 Bundling de l'application..."
npx esbuild src/app-tailwind.ts --bundle --outfile=public/app-bundle.js --platform=browser --minify

echo "✅ Build complète!"
