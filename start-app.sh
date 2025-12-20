#!/bin/bash

echo "🚀 DÉMARRAGE APPLICATION COMPLÈTE"
echo "=================================="
echo ""

# Vérifier que le build intégré a été fait
if [ ! -d "backend/staticfiles" ]; then
    echo "📦 Build intégré manquant, compilation..."
    bash build-integrated.sh
fi

# Démarrer le backend
echo "🔧 Configuration Django..."
cd backend

# Activer venv
if [ ! -d "venv" ]; then
    echo "📦 Création venv..."
    python -m venv venv
fi
source venv/bin/activate

# Installer dépendances
if ! python -c "import django" 2>/dev/null; then
    echo "📦 Installation dépendances..."
    pip install -q -r requirements.txt
fi

# Migrations
echo "🗄️  Migrations Django..."
python manage.py migrate --noinput

# Créer superuser si nécessaire
if ! python manage.py shell -c "from django.contrib.auth import get_user_model; exit(0 if get_user_model().objects.filter(username='admin').exists() else 1)" 2>/dev/null; then
    echo "👤 Création superuser admin:admin..."
    python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.create_superuser('admin', 'admin@example.com', 'admin') if not User.objects.filter(username='admin').exists() else None"
fi

echo ""
echo "✅ Serveur prêt!"
echo ""
echo "🌐 Accès:"
echo "   App:   http://localhost:8000"
echo "   Admin: http://localhost:8000/admin (admin:admin)"
echo ""
echo "▶️  Démarrage..."
echo ""

python manage.py runserver 0.0.0.0:8000
