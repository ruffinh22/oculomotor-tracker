# Frontend - Suivi Oculaire Clinique

Architecture TypeScript professionnelle avec services, state management et composants modulaires.

## 🏗️ Architecture

### Structure des dossiers

```
src/
├── services/
│   ├── api.service.ts       # Service API REST
│   └── state.service.ts     # Gestion d'état centralisée
├── components/
│   └── screens.ts           # Composants d'écrans
├── eyeTracker.ts            # Wrapper WebGazer
├── targetDetector.ts        # Détection de cible en mouvement
├── distanceEstimator.ts     # Estimation distance œil-écran
├── testAnalyzer.ts          # Analyse des résultats
├── app-professional.ts      # Application principale
└── server.ts                # Serveur Express

public/
├── index-professional.html  # Page HTML principale
├── styles-professional.css  # Styles modernes
└── assets/                  # Images, icônes, etc.
```

## 🎯 Services

### ApiService (`services/api.service.ts`)

Service de communication avec le backend Django.

```typescript
// Authentification
await apiService.register(username, email, password, firstName, lastName, age);
await apiService.login(username, password);
apiService.logout();

// Patient
const patient = await apiService.getPatient();

// Tests
await apiService.createTest(testData);
const tests = await apiService.getTests();

// Statistiques
const stats = await apiService.getStatistics();

// ML Prediction
const prediction = await apiService.predictTest(testData);
```

### StateManager (`services/state.service.ts`)

Gestion centralisée de l'état avec persistence localStorage.

```typescript
// Abonnement aux changements
const unsubscribe = stateManager.subscribe((state) => {
    console.log('État changé:', state);
});

// Opérations
stateManager.setPatient(patient);
stateManager.setScreen('test-screen');
stateManager.startNewTest();
stateManager.updateCurrentTest(data);
stateManager.finishCurrentTest();
stateManager.addTestResult(result);
stateManager.setStatistics(stats);
stateManager.addNotification('Message', 'success');
```

## 🧩 Composants

### Écrans disponibles

- **home-screen**: Accueil avec options
- **calibration-screen**: Calibration du eye tracker
- **test-screen**: Test de suivi oculaire
- **results-screen**: Résultats des tests
- **statistics-screen**: Statistiques et tendances

## 🎨 Design System

### Couleurs
- **Primaire**: `#0066cc` (Bleu)
- **Succès**: `#28a745` (Vert)
- **Danger**: `#dc3545` (Rouge)
- **Avertissement**: `#ffc107` (Orange)
- **Info**: `#17a2b8` (Cyan)

### Composants UI
- Boutons `.btn-primary`, `.btn-secondary`, `.btn-success`, `.btn-danger`
- Notifications avec types: `success`, `error`, `info`, `warning`
- Cartes d'action avec hover effects
- Grilles responsives

## 🚀 Flux d'authentification

```
1. Utilisateur arrive sur home-screen
2. Saisit identifiants (login) ou informations (register)
3. Frontend envoie requête à /api/auth/login/ ou /api/auth/register/
4. Backend retourne token JWT
5. Frontend stocke token en localStorage
6. StateManager met à jour patient et isAuthenticated
7. Navigation vers home-screen authentifiée

Chaque requête API ajoute: Authorization: Bearer <token>
```

## 🧪 Flux de test

```
1. Utilisateur clique "Nouveau Test" -> test-screen
2. Calibration requise si isCalibrated = false
3. Clic "Démarrer le test" -> startNewTest()
4. EyeTracker capture gaze data
5. TargetDetector suit la cible
6. TestAnalyzer calcule les metrics
7. Clic "Arrêter le test" -> finishCurrentTest()
8. Données envoyées à /api/tests/
9. Backend retourne ML prediction
10. Affichage des résultats -> results-screen
```

## 📊 Modèles de données

### PatientData (Login/Register)
```typescript
{
    id: number;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    age: number;
}
```

### TestData (Envoyé au backend)
```typescript
{
    duration: number;              // Secondes
    gaze_time: number;             // Secondes
    tracking_percentage: number;   // 0-100
    fixation_count: number;
    avg_fixation_duration: number; // ms
    gaze_stability: number;        // 0-1
    gaze_consistency: number;      // 0-1
    raw_data: Record<string, any>;
}
```

## 🛠️ Installation et démarrage

```bash
# Installation des dépendances
npm install

# Développement (watch mode)
npm run dev

# Build TypeScript
npm run build

# Lancer le serveur
npm start
```

## 🔌 Intégration API

### Configuration

Modifier `services/api.service.ts`:
```typescript
constructor(baseUrl: string = 'http://localhost:8000')
```

### Endpoints Django utilisés

- `POST /api/auth/register/` - Inscription
- `POST /api/auth/login/` - Connexion
- `GET /api/patients/me/` - Patient actuel
- `GET /api/tests/` - Liste des tests
- `POST /api/tests/` - Créer un test
- `GET /api/tests/statistics/` - Statistiques
- `POST /ml/predict/` - Prédiction ML

## 📱 Responsive Design

L'application est responsive et fonctionne sur:
- Desktop (1920x1080+)
- Tablet (768px+)
- Mobile (< 768px)

Points de rupture:
```css
@media (max-width: 768px) {
    /* Adaptations mobiles */
}
```

## 🔐 Sécurité

### LocalStorage
- `access_token` - JWT token (30 jours)
- `refresh_token` - Refresh token
- `app_state` - État de l'application

### Authentification
- Chaque requête inclut header `Authorization: Bearer <token>`
- Logout supprime les tokens et réinitialise l'état

## 🐛 Debugging

Console logs disponibles:
```typescript
console.log('État:', stateManager.getState());
console.log('Token:', apiService.getToken());
console.log('Authentifié:', apiService.isAuthenticated());
```

## ✅ Checklist développement

- [ ] Installer dépendances: `npm install`
- [ ] Démarrer serveur frontend: `npm run dev`
- [ ] Démarrer serveur backend Django: `python manage.py runserver`
- [ ] Accéder à `http://localhost:3000`
- [ ] S'inscrire/Se connecter
- [ ] Calibrer le eye tracker
- [ ] Effectuer un test
- [ ] Vérifier résultats et statistiques

## 📝 Notes importantes

1. **WebGazer**: Nécessite HTTPS en production
2. **CORS**: Configuré depuis Django (localhost:3000)
3. **Eye Tracking**: Nécessite permission caméra du navigateur
4. **TypeScript**: Strict mode activé
5. **État**: Persiste entre les sessions

## 🚀 Prochaines étapes

- [ ] Implémenter rechargement du token (refresh token flow)
- [ ] Ajouter caching des données (Service Worker)
- [ ] Tests unitaires (Jest/Vitest)
- [ ] E2E tests (Cypress)
- [ ] Monitoring et analytics
- [ ] Offline support
