#!/bin/bash

# Script de démarrage du backend Django

echo "🚀 Démarrage du backend Django..."

# Crée les répertoires nécessaires
mkdir -p keys ml_models logs

# Installe les dépendances si nécessaire
if [ ! -d "venv" ]; then
    echo "📦 Création de l'environnement virtuel..."
    python -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

# Copie le fichier .env s'il n'existe pas
if [ ! -f ".env" ]; then
    echo "📋 Création du fichier .env..."
    cp .env.example .env
fi

# Migrations
echo "🔄 Application des migrations..."
python manage.py migrate

# Créé un superutilisateur s'il n'existe pas
echo "👤 Création du superutilisateur..."
python manage.py createsuperuser --noinput --username admin --email admin@example.com 2>/dev/null || true

# Collecte les fichiers statiques
echo "📦 Collecte des fichiers statiques..."
python manage.py collectstatic --noinput

# Lance le serveur
echo "✅ Démarrage du serveur sur http://localhost:8000"
python manage.py runserver 0.0.0.0:8000
