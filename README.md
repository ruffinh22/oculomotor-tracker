# 👁️ Oculomotor Tracker - Système de Suivi Oculaire Clinique

Plateforme web complète pour le suivi oculaire clinique avec WebGazer.js, gestion multi-patients, authentification JWT et génération de rapports PDF.

## 🎯 Caractéristiques Principales

✅ **Suivi Oculaire en Temps Réel** - WebGazer.js pour calibration et suivi oculaire précis
✅ **Gestion Multi-Patients** - Interface admin pour créer et gérer des patients
✅ **4 Interfaces UI** - Gouvernementale DSFR, Professionnelle, DSFR complet, Tailwind CSS
✅ **Tests Structurés** - Calibration, suivi oculaire, analyse des fixations
✅ **Metrics Détaillées** - Stabilité, consistance, durée de fixations, pourcentage de tracking
✅ **Génération de Rapports** - Export PDF des résultats d'eye-tracking
✅ **Authentification JWT** - Sécurisation avec tokens JWT pour utilisateurs et patients
✅ **Machine Learning** - TensorFlow pour prédictions (optionnel)
✅ **Responsif** - Compatible desktop, tablette, mobile
✅ **Docker Ready** - Déploiement simplifié avec Docker Compose

## 🏗️ Architecture

```
Frontend (TypeScript)          Backend (Django)           Database
─────────────────────          ──────────────             ────────
├── app-gouv.ts          →    ├── api/                   PostgreSQL
├── app-professional.ts   →    │   ├── models.py          (+ SQLite dev)
├── app-dsfr.ts          →    │   ├── serializers.py
├── app-tailwind.ts      →    │   ├── views.py           Cache
├── eyeTracker.ts        →    │   └── urls.py            Redis
├── services/            →    ├── config/
│   ├── api.service.ts   →    │   ├── settings.py
│   └── state.service.ts →    │   └── wsgi.py
└── components/          →    ├── security/
    └── screens-*.ts     →    │   ├── authentication.py
                              │   └── middleware.py
                              └── ml/
                                  └── predictor.py
```

## ⚡ Quick Start

### 1. Installation Frontend

```bash
# Installer les dépendances Node.js
npm install

# Compiler les bundles TypeScript
npm run build

# Lancer le serveur frontend
npm start
```

Frontend: `http://localhost:3000`

### 2. Installation Backend

```bash
# Accéder au répertoire backend
cd backend

# Créer un environnement virtuel
python -m venv venv
source venv/bin/activate  # ou: venv\Scripts\activate (Windows)

# Installer les dépendances Python
pip install -r requirements.txt

# Exécuter les migrations
python manage.py migrate

# Créer un utilisateur admin
python manage.py createsuperuser

# Lancer le serveur Django
python manage.py runserver
```

Backend API: `http://localhost:8000/api`
Admin panel: `http://localhost:8000/admin`

### 3. Utiliser l'Application

1. **Se connecter** - Utiliser les identifiants du superuser créé
2. **Créer un patient** - Admin → "Patient Selection" → "Créer un nouveau patient"
3. **Sélectionner le patient** - Choisir un patient dans la liste
4. **Calibration** (optionnel) - Suivre 5 points rouges pour calibrer le regard
5. **Lancer le test** - Le système enregistre le suivi oculaire
6. **Consulter les résultats** - Voir les métriques de performance

## 📊 Variantes UI

### Gouvernementale DSFR
```bash
# Utiliser index.html (défaut)
# Design officiel République Française
# Couleur: Bleu (#000091)
```

### Professionnelle
```bash
# Utiliser index-professional.html
# Design moderne et épuré
# Couleur: Bleu professionnel (#0066cc)
# Optimisée pour cliniques et cabinets
```

### DSFR Complet
```bash
# Utiliser index-gouv.html
# Design DSFR maximal avec tous les composants
```

### Tailwind CSS
```bash
# Utiliser index-tailwind.html
# Framework CSS moderne et personnalisable
```

## 🔧 Configuration

### Variables d'Environnement Backend

Créer `backend/.env`:

```env
DEBUG=True
SECRET_KEY=django-insecure-your-secret-key
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000
DATABASE_URL=postgresql://user:password@localhost:5432/oculomotor
JWT_SECRET_KEY=your-jwt-secret-key
```

### Variables d'Environnement Frontend

Créer `.env` à la racine:

```env
REACT_APP_API_URL=http://localhost:8000/api
NODE_ENV=development
```

## 📡 API REST - Endpoints Principaux

```
POST   /api/auth/login/              - Connexion
POST   /api/auth/register/           - Inscription
GET    /api/patients/                - Lister les patients
POST   /api/patients/                - Créer un patient
GET    /api/tests/                   - Lister les tests
POST   /api/tests/                   - Créer un test
GET    /api/tests/{id}/              - Détails du test
```

## 🐳 Déploiement Docker

### Mode Development

```bash
docker-compose up
# Frontend: http://localhost:3000
# Backend: http://localhost:8000
```

### Mode Production (stackwarriors.dev)

```bash
# Configurer les secrets
cp .env.production .env.prod
nano .env.prod

# Déployer
./deploy.sh production

# Application: https://stackwarriors.dev
```

Voir [DEPLOYMENT.md](DEPLOYMENT.md) pour le guide complet.

## 📁 Structure du Projet

```
oculomotor-tracker/
├── src/                           # Source TypeScript
│   ├── app-gouv.ts               # App gouvernementale
│   ├── app-professional.ts       # App professionnelle
│   ├── app-dsfr.ts               # App DSFR
│   ├── app-tailwind.ts           # App Tailwind
│   ├── eyeTracker.ts             # Intégration WebGazer
│   ├── services/
│   │   ├── api.service.ts        # Requêtes API
│   │   └── state.service.ts      # Gestion d'état
│   └── components/
│       ├── screens-gouv.ts       # Composants DSFR
│       ├── screens-professional.ts
│       ├── screens-dsfr.ts
│       └── screens-tailwind.ts
├── public/                        # Bundles compilés
│   ├── app-gouv-bundle.js
│   ├── app-bundle.js
│   ├── index.html
│   └── styles-*.css
├── backend/
│   ├── api/                       # Django REST API
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── config/                    # Paramètres Django
│   ├── security/                  # Auth & middleware
│   ├── ml/                        # TensorFlow (optionnel)
│   ├── manage.py
│   └── requirements.txt
├── docker-compose.yml
├── docker-compose.production.yml
├── deploy.sh
├── DEPLOYMENT.md
├── package.json
└── README.md
```

## 🔐 Sécurité

- **JWT Authentication** - Tokens securisés pour API
- **CORS Protection** - Domaines autorisés
- **HTTPS/SSL** - Certificats Let's Encrypt automatiques
- **CSRF Protection** - Tokens CSRF Django
- **Password Hashing** - Bcrypt + salting
- **Input Validation** - Validation côté serveur et client
- **Rate Limiting** - Limitation des requêtes API

## 🧪 Tests

```bash
# Backend - Tests Python
cd backend
python manage.py test

# Frontend - Tests TypeScript
npm test
```

## 📈 Metrics et Analyse

Le système enregistre pour chaque test:

- **Duration** - Durée totale du test
- **Gaze Time** - Temps de suivi oculaire actif
- **Tracking Percentage** - % du temps où le regard était détecté
- **Fixation Count** - Nombre de fixations
- **Avg/Max/Min Fixation Duration** - Durée des fixations
- **Gaze Stability** - Stabilité du regard (0-100)
- **Gaze Consistency** - Consistance du regard (0-100)
- **Raw Data** - Données brutes de suivi pour analyse ultérieure

## 🤖 Machine Learning (Optionnel)

Modèle TensorFlow pour prédictions:

```bash
# Entraîner le modèle
python backend/ml/predictor.py --train

# Faire une prédiction
curl -X POST http://127.0.0.1:8000/api/ml/predict/ \
  -H "Content-Type: application/json" \
  -d '{"gaze_data": [...]}'
```

## 🔧 Dépendances Principales

**Frontend:**
- TypeScript
- esbuild (bundler)
- WebGazer.js (CDN)

**Backend:**
- Django 4.2.8
- Django REST Framework 3.14
- TensorFlow 2.20 (optionnel)
- PostgreSQL/SQLite

## 📝 Fichiers Clés

| Fichier | Description |
|---------|-------------|
| `src/eyeTracker.ts` | Intégration WebGazer + repositionnement caméra |
| `backend/api/views.py` | Endpoints API tests et patients |
| `backend/api/serializers.py` | Sérialisation avec patient_name |
| `src/services/state.service.ts` | Gestion d'état globale |
| `src/app-gouv.ts` | App principale gouvernementale |
| `nginx.conf` | Configuration Nginx/proxy |

## 🚀 Déploiement en Production

Voir le guide complet: [DEPLOYMENT.md](DEPLOYMENT.md)

Résumé:
```bash
# 1. SSH sur le serveur
ssh user@stackwarriors.dev

# 2. Cloner et configurer
git clone https://github.com/ruffinh22/oculomotor-tracker.git
cd oculomotor-tracker
cp .env.production .env.prod

# 3. Déployer
./deploy.sh production

# Application: https://stackwarriors.dev
```

## 🐛 Troubleshooting

### WebGazer ne démarre pas
- Vérifier les permissions de webcam du navigateur
- Accepter la permission d'accès caméra
- Rafraîchir la page (F5 ou Ctrl+R)

### Erreur CORS
```bash
# Vérifier CORS_ALLOWED_ORIGINS dans .env
grep CORS .env
# Redémarrer: python manage.py runserver
```

### Port déjà utilisé
```bash
# Trouver et tuer le processus
lsof -i :3000  # ou :8000
kill -9 PID
```

### Erreur de migration DB
```bash
cd backend
python manage.py migrate --run-syncdb
```

## 📚 Documentation Additionnelle

- [DEPLOYMENT.md](DEPLOYMENT.md) - Guide de déploiement production
- [DESIGN_DSFR.md](DESIGN_DSFR.md) - Design system DSFR
- [FRONTEND.md](FRONTEND.md) - Détails frontend
- [VERSIONS.md](VERSIONS.md) - Historique des versions

## 🤝 Contribution

1. Fork le dépôt
2. Créer une branche (`git checkout -b feature/amazing`)
3. Commit (`git commit -m 'Add amazing feature'`)
4. Push (`git push origin feature/amazing`)
5. Ouvrir une Pull Request

## 📄 Licence

MIT License - Voir [LICENSE](LICENSE)

## 📧 Support

Pour questions ou issues:
- GitHub Issues: https://github.com/ruffinh22/oculomotor-tracker/issues
- Email: support@stackwarriors.dev

---

**Développé pour la clinique de suivi oculaire** | 2025
**Repository**: https://github.com/ruffinh22/oculomotor-tracker
**Production**: https://stackwarriors.dev
- Graphique de suivi
- Option d'impression

## 🔧 Architecture

```
nous/
├── public/
│   ├── index.html          # Interface principale
│   ├── app.js              # Application main
│   └── styles.css          # Styles
├── src/
│   ├── eyeTracker.js       # Module WebGazer
│   ├── targetDetector.js   # Détection cible
│   ├── distanceEstimator.js # Distance œil-écran
│   └── testAnalyzer.js     # Analyse résultats
├── server.js               # Serveur Express
└── package.json            # Dépendances
```

## 📊 Modules

### EyeTracker
- Initialise WebGazer
- Capture les données du regard
- Détecte ouverture/fermeture des yeux

### TargetDetector
- Gère la cible en mouvement
- Analyse le suivi du regard
- Calcule les fixations

### DistanceEstimator
- Estime distance œil-écran
- Valide la position du patient

### TestAnalyzer
- Génère statistiques
- Évaluation clinique
- Score de qualité

## 🧪 Précision

La précision dépend de:
- **Calibration**: 9 points recommandé
- **Distance**: 30-70cm idéal
- **Lumière**: Bon éclairage essentiel
- **Stabilité**: Patient immobile
- **Eyetracker**: Matériel de qualité recommandé

## 📈 Critères de suivi

Considère que le patient "a vu" si:
- ✅ Regard sur cible > 150-300ms
- ✅ Regard "suit" le mouvement
- ✅ Œil détecté ouvert
- ✅ Distance œil-écran correcte

## 🔍 Limitations actuelles

- Estimation distance basique (calibration recommandée)
- Eyetracker gratuit (webgazer) moins précis
- Pas de détection saccades
- Pas de stockage base de données

## 🚀 Améliorations futures

- [ ] Intégration avec hardware eyetracker (Tobii, Pupil Labs)
- [ ] Base de données pour historique patients
- [ ] ML pour améliorer précision
- [ ] Export PDF rapport
- [ ] Comparaison tests dans le temps
- [ ] Support plusieurs langues

## 📝 Notes cliniques

Pour usage orthoptique:
- Test dure 20-30 secondes
- Évaluation: excellent (>80%), bon (60-80%), moyen (40-60%), faible (<40%)
- Rapport automatique imprimable
- Données patient sécurisées

## ⚖️ Licence

MIT - Voir LICENSE

## 👨‍💻 Développeur

Ruf - Application développée pour clinique orthoptiste
