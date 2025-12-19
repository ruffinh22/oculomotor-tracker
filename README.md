# Suivi Oculaire Clinique - Eye Tracking Application

Application web de suivi oculaire pour clinique orthoptiste. Détecte automatiquement si un patient regarde une cible en mouvement.

## 🎯 Fonctionnalités

- **Calibration automatique** - 9 points de calibration pour précision maximale
- **Détection de cible en mouvement** - Cible dynamique avec rebonds
- **Suivi du regard** - Analyse en temps réel du regard du patient
- **Distance œil-écran** - Estimation de la distance pour validation
- **Analyse clinique** - Rapport détaillé avec statistiques
- **Support binoculaire** - Détection yeux ouverts/fermés
- **Interface responsive** - Compatible tous appareils

## 🚀 Installation

```bash
# Cloner le projet
cd /home/lidruf/nous

# Installer les dépendances
npm install

# Démarrer le serveur
npm start
```

Le serveur démarre sur `http://localhost:3000`

## 📋 Utilisation

### 1. Écran d'accueil
- Remplir les informations du patient (nom, âge, date)
- Cliquer sur "Commencer le calibrage"

### 2. Calibration (optionnelle)
- Suivre 9 points rouges
- Cliquer sur chaque point quand le regard est fixé
- Ou "Passer le calibrage" pour moins de précision

### 3. Test
- Suivre la cible en mouvement avec les yeux
- Le système détecte automatiquement le suivi
- Durée: 20-30 secondes recommandée
- Cliquer "Terminer le test" quand terminé

### 4. Résultats
- Rapport clinique détaillé
- Pourcentage de suivi
- Nombre de fixations
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
