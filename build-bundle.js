#!/usr/bin/env node

import * as esbuild from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function build() {
  try {
    console.log('🔨 Bundling application avec esbuild...');
    
    await esbuild.build({
      entryPoints: ['dist/app-dsfr.js'],
      bundle: true,
      outfile: 'public/app-dsfr-bundle.js',
      platform: 'browser',
      target: ['es2020'],
      format: 'iife',
      globalName: 'EyeTrackingApp',
      external: [],
      define: {
        'process.env.NODE_ENV': '"production"'
      },
      sourcemap: true,
      minify: false,
      splitting: false,
      write: true,
    });
    
    console.log('✅ Bundle créé: public/app-dsfr-bundle.js');
  } catch (error) {
    console.error('❌ Erreur de bundling:', error);
    process.exit(1);
  }
}

build();
