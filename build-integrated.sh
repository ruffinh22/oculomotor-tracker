#!/bin/bash

echo "🔨 BUILD INTÉGRÉ FRONTEND + BACKEND"
echo "===================================="

# 1. Build TypeScript
echo "📦 Compilation TypeScript..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Erreur de compilation TypeScript"
    exit 1
fi

# 2. Créer le dossier de destination
echo "📂 Préparation du dossier staticfiles..."
STATIC_DIR="backend/staticfiles"
rm -rf "$STATIC_DIR"
mkdir -p "$STATIC_DIR"

# 3. Copier les fichiers frontend compilés
echo "📋 Copie des fichiers compilés..."
cp -r public/* "$STATIC_DIR/" 2>/dev/null || true
cp -r dist/* "$STATIC_DIR/" 2>/dev/null || true

# 4. Copier les fichiers statiques Django
echo "🏗️  Collecte des fichiers statiques Django..."
cd backend
python manage.py collectstatic --noinput --clear
cd ..

# 5. Verification
echo ""
echo "✅ BUILD INTÉGRÉ TERMINÉ!"
echo ""
echo "📊 Contenu de staticfiles/"
ls -lh "$STATIC_DIR" | head -20
echo ""
echo "🚀 DÉMARRAGE:"
echo "   cd backend && python manage.py runserver"
echo ""
