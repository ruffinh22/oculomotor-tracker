# Backend Django - Suivi Oculaire Clinique

Backend Django avec Machine Learning et Sécurité Tink pour l'application de suivi oculaire clinique.

## 🎯 Fonctionnalités

### API REST
- **Authentification sécurisée** avec JWT
- **Gestion des patients** et tests
- **Endpoints** pour créer, lire et analyser les tests de suivi oculaire

### Machine Learning
- **TensorFlow** pour la classification des tests
- **Scikit-learn** pour la détection d'anomalies
- **Prédiction automatique** du résultat du test
- **Entraînement du modèle** avec les données historiques

### Sécurité
- **Tink** pour le chiffrement des données sensibles
- **AEAD** (chiffrement symétrique) pour les données JSON
- **DAEAD** (chiffrement déterministe) pour les identifiants
- **Headers de sécurité** HTTP
- **Audit logging** de tous les accès

## 📋 Installation

### Prérequis
- Python 3.9+
- Django 4.2+
- PostgreSQL (optionnel, utilise SQLite par défaut)

### Configuration

1. **Clone le projet**
```bash
cd backend
cp .env.example .env
```

2. **Crée un environnement virtuel**
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate  # Windows
```

3. **Installe les dépendances**
```bash
pip install -r requirements.txt
```

4. **Initialise la base de données**
```bash
python manage.py migrate
python manage.py createsuperuser
```

5. **Crée les répertoires nécessaires**
```bash
mkdir -p keys ml_models logs
```

## 🚀 Utilisation

### Démarrer le serveur de développement
```bash
python manage.py runserver
```

Le serveur démarre sur `http://localhost:8000`

### API Endpoints

#### Authentification
- `POST /api/auth/register/` - Créer un compte
- `POST /api/auth/login/` - Se connecter

#### Patients
- `GET /api/patients/` - Liste des patients
- `GET /api/patients/{id}/` - Détails patient
- `PUT /api/patients/{id}/` - Modifier patient

#### Tests
- `GET /api/tests/` - Liste des tests
- `POST /api/tests/` - Créer un test
- `GET /api/tests/{id}/` - Détails test
- `GET /api/tests/statistics/` - Statistiques patient

#### Machine Learning
- `POST /ml/train/` - Entraîner le modèle (admin)
- `GET /ml/evaluate/` - Évaluer le modèle (admin)
- `POST /ml/export/` - Exporter le modèle (admin)

## 🔐 Sécurité

### Tink Encryption
```python
from security.security_manager import TinkSecurityManager

manager = TinkSecurityManager()

# Chiffrage symétrique (AEAD)
encrypted = manager.encrypt_data({'patient_id': 123})
decrypted = manager.decrypt_data(encrypted)

# Chiffrage déterministe
encrypted_id = manager.encrypt_deterministic('patient123')

# Hash
hashed = manager.hash_data('password')
```

### Headers de sécurité
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000`
- `Content-Security-Policy`

## 🤖 Machine Learning

### Prédiction automatique
```python
from ml.predictor import EyeTrackingPredictor

predictor = EyeTrackingPredictor()
result = predictor.predict(test_data)

print(result['result'])  # 'excellent', 'good', 'acceptable', 'poor'
print(result['confidence'])  # Confiance (0-1)
print(result['anomaly_detected'])  # Détection d'anomalie
```

### Features utilisées
- Pourcentage de suivi
- Nombre de fixations
- Durée moyenne des fixations
- Stabilité du regard
- Cohérence du suivi
- Distance œil-écran

### Entraînement du modèle
```bash
# Entraîner avec les données existantes
curl -X POST http://localhost:8000/ml/train/ \
  -H "Authorization: Bearer <token>"

# Évaluer le modèle
curl http://localhost:8000/ml/evaluate/ \
  -H "Authorization: Bearer <token>"
```

## 📊 Modèles ML

### Architecture réseau de neurones
```
Input (8 features)
  ↓
Dense(64, relu) + Dropout(0.3)
  ↓
Dense(32, relu) + Dropout(0.2)
  ↓
Dense(16, relu)
  ↓
Output (4 classes, softmax)
```

### Détection d'anomalies
- **Isolation Forest** pour détecter les comportements anormaux
- Contamination: 10%

## 🗄️ Modèles de données

### Patient
- `user` (OneToOne User)
- `age`
- `created_at`
- `updated_at`

### EyeTrackingTest
- `patient` (ForeignKey)
- `test_date`
- `duration`
- `gaze_time`
- `tracking_percentage`
- `fixation_count`
- `avg_fixation_duration`
- `gaze_stability`
- `result` (excellent, good, acceptable, poor)
- `raw_data` (JSON)

### MLPrediction
- `test` (OneToOne)
- `predicted_result`
- `confidence_score`
- `anomaly_detected`
- `features` (JSON)

## 📚 Admin Django

Accédez à l'admin sur `http://localhost:8000/admin/`

Patients, Tests, et Prédictions ML sont gérables depuis l'interface admin.

## 🔄 Déploiement en production

1. **Définir les variables d'environnement**
```bash
DEBUG=False
SECRET_KEY=votre-clé-secrète-sécurisée
ALLOWED_HOSTS=votre-domaine.com
CORS_ALLOWED_ORIGINS=https://votre-domaine.com
```

2. **Utiliser PostgreSQL**
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': env('DB_NAME'),
        'USER': env('DB_USER'),
        'PASSWORD': env('DB_PASSWORD'),
        'HOST': env('DB_HOST'),
        'PORT': '5432',
    }
}
```

3. **Lancer avec Gunicorn**
```bash
gunicorn config.wsgi:application --bind 0.0.0.0:8000
```

## 📝 Licence

MIT

## 👨‍💻 Auteur

Ruf - Développement backend pour clinique orthoptiste
