#!/bin/bash

# Build Production Script - Eye Tracking Clinical
# Prépare l'application complète pour production

set -e

echo "🏗️  Démarrage du build production..."
echo ""

# Colours
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. TypeScript Compilation with strict mode
echo -e "${BLUE}1️⃣  Compilation TypeScript (strict mode)...${NC}"
npx tsc --strict
echo -e "${GREEN}✅ TypeScript compilé${NC}"
echo ""

# 2. Verify all files exist
echo -e "${BLUE}2️⃣  Vérification des fichiers générés...${NC}"
FILES_TO_CHECK=(
    "dist/server.js"
    "dist/index.html"
    "dist/app-dsfr.js"
    "dist/app-gouv.js"
    "dist/app-professional.js"
    "dist/app-tailwind.js"
    "public/index.html"
    "public/index-tailwind.html"
    "public/index-gouv.html"
    "public/index-dsfr.html"
    "public/index-professional.html"
    "public/app-bundle.js"
    "public/app-gouv-bundle.js"
    "public/app-dsfr-bundle.js"
    "public/app-tailwind.js"
    "public/styles-tailwind.css"
    "public/styles-gouv.css"
    "public/styles-dsfr.css"
    "public/styles-professional.css"
    "public/favicon.svg"
)

MISSING_FILES=0
for file in "${FILES_TO_CHECK[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✓ $file"
    else
        echo "  ✗ $file (MANQUANT)"
        MISSING_FILES=$((MISSING_FILES + 1))
    fi
done

if [ $MISSING_FILES -gt 0 ]; then
    echo -e "${RED}❌ $MISSING_FILES fichiers manquants${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Tous les fichiers présents${NC}"
echo ""

# 3. Calculate sizes
echo -e "${BLUE}3️⃣  Tailles des fichiers...${NC}"
echo "  Bundles JavaScript:"
du -h dist/app-*.js | awk '{print "    dist/" $2 ": " $1}'
du -h public/app-*.js | awk '{print "    public/" $2 ": " $1}'

echo ""
echo "  Fichiers CSS:"
du -h public/styles-*.css | awk '{print "    " $2 ": " $1}'

echo ""

# 4. Summary
echo -e "${BLUE}4️⃣  Résumé du build${NC}"
echo "  Total des fichiers dist/:"
ls -1 dist/ | wc -l
echo "  fichiers compilés"
echo ""

# 5. Backend requirements
echo -e "${BLUE}5️⃣  Vérification des dépendances Python...${NC}"
if [ -f "backend/requirements.txt" ]; then
    echo "  $(wc -l < backend/requirements.txt) dépendances listées"
    echo -e "${GREEN}✅ requirements.txt présent${NC}"
else
    echo -e "${RED}❌ backend/requirements.txt manquant${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 BUILD PRODUCTION PRÊT POUR DÉPLOIEMENT!${NC}"
echo ""
echo "📦 Structure de production:"
echo "  Frontend: dist/ + public/"
echo "  Backend: backend/"
echo "  Configuration: docker-compose.yml, nginx.conf, .env"
echo ""
echo "🚀 Prochaine étape: docker-compose up -d"
echo ""
