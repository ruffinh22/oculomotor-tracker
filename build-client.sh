#!/bin/bash

# Script de compilation TypeScript et bundling du client avec esbuild

echo "📦 Compilation et bundling du client..."

# Point d'entrée principal (Tailwind version)
ENTRY_POINT="src/app-tailwind.ts"

# Compile avec esbuild - crée un bundle IIFE pour le navigateur
npx esbuild "$ENTRY_POINT" \
  --bundle \
  --format=iife \
  --global-name=EyeTrackingApp \
  --outfile=public/app-bundle.js \
  --platform=browser \
  --target=es2020 \
  --sourcemap \
  --external:webgazer

if [ $? -eq 0 ]; then
    echo "✅ Bundling du client réussi"
    echo "📍 Fichier généré: public/app-bundle.js"
else
    echo "❌ Erreur de bundling"
    exit 1
fi
