# Système de Suivi Oculaire Clinique (SOOC)

Application web de suivi oculaire pour les professionnels de santé avec trois designs disponibles.

## 🎨 Versions de Design

### 1. **Gouvernemental (Défaut)** - `index.html`
- Style: Bleu République français (#000091)
- Design: DSFR (Système de Design de l'État)
- CSS: `styles-gouv.css`
- Bundle: `app-gouv-bundle.js`
- **URL:** `http://localhost:8000/` ou `http://localhost:8000/index.html`

### 2. **Tailwind** - `index-tailwind.html`
- Style: Design moderne avec Tailwind CSS v4
- CSS: `styles-tailwind.css`
- Bundle: `app-bundle.js`
- **URL:** `http://localhost:8000/index-tailwind.html`

### 3. **Professionnel** - `index-professional.html`
- Style: Bleu professionnel corporatif
- CSS: `styles-professional.css`
- Bundle: `app-professional-bundle.js`
- **URL:** `http://localhost:8000/index-professional.html`

### 4. **DSFR** - `index-dsfr.html`
- Style: Système de Design de l'État complet
- CSS: `styles-dsfr.css`
- Bundle: `app-dsfr-bundle.js`
- **URL:** `http://localhost:8000/index-dsfr.html`

## 🚀 Démarrage Rapide

### Installation
```bash
# Installer les dépendances
npm install

# Démarrer le serveur Django (terminal 1)
cd backend
python manage.py runserver

# Démarrer le serveur web (terminal 2)
python simple_server.py
```

### Build
```bash
# Reconstruire tous les bundles
npm run build

# Ou build spécifique
npx esbuild src/app-gouv.ts --bundle --outfile=public/app-gouv-bundle.js --platform=browser
```

## 🎯 Fonctionnalités

- ✅ Authentification (Login/Register)
- ✅ Calibration du suivi oculaire (5 points)
- ✅ Tests de suivi oculaire en temps réel
- ✅ Calcul de métriques (stabilité, cohérence, suivi %)
- ✅ Historique des tests
- ✅ Export en PDF (à venir)
- ✅ Prédictions ML (à venir)

## 🎨 Couleurs DSFR

| Élément | Couleur | Code |
|---------|---------|------|
| Bleu République | Bleu marine | #000091 |
| Bleu hover | Bleu clair | #2d2d9c |
| Succès | Vert | #18753c |
| Danger | Rouge | #ce0500 |
| Warning | Orange | #ff9947 |
| Info | Bleu info | #0a76f6 |

## 📱 Responsive

Tous les designs sont entièrement responsifs :
- Desktop: Full width
- Tablet: 75% width
- Mobile: 95% width avec navigation adaptée

## 🔐 Sécurité

- Tokens JWT avec refresh automatique
- CORS configuré pour localhost:8000
- Protection CSRF sur formulaires

## 📊 Stack Technique

**Frontend:**
- TypeScript
- ESBuild (compilation)
- Tailwind CSS v4 (CDN)
- WebGazer.js (eye tracking)

**Backend:**
- Django 4.2.8
- Django REST Framework
- SQLite

**Déploiement:**
- Frontend: Serveur web statique
- Backend: Django sur port 8000

## 🤝 Support

Pour les gouvernements français, voir: https://www.systeme-de-design.gouv.fr/
