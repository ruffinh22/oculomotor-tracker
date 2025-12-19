#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputFile = path.join(__dirname, 'src/globals.css');
const outputFile = path.join(__dirname, 'public/styles-tailwind.css');

// Lire le fichier CSS d'entrée
const css = fs.readFileSync(inputFile, 'utf8');

// Créer un traitement PostCSS avec Tailwind
const processor = postcss([tailwindcss]);

// Traiter le CSS
processor
  .process(css, { from: inputFile, to: outputFile })
  .then((result) => {
    // Écrire le résultat
    fs.writeFileSync(outputFile, result.css);
    console.log(`✅ CSS Tailwind généré: ${outputFile}`);
    console.log(`📊 Taille: ${(result.css.length / 1024).toFixed(2)} KB`);
  })
  .catch((error) => {
    console.error('❌ Erreur lors de la génération du CSS:', error);
    process.exit(1);
  });
