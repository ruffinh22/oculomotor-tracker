# 🚀 Guide de Déploiement - stackwarriors.dev

## Architecture de Production

```
┌─────────────────────────────────────────────────────┐
│  Nginx Reverse Proxy (SSL/TLS)                      │
│  stackwarriors.dev:443                              │
└──────────┬──────────────────────────────────────────┘
           │
    ┌──────┴──────┬──────────┐
    │             │          │
┌───▼──┐     ┌───▼──┐   ┌──▼────┐
│ API  │     │  Web │   │Static │
│:8000 │     │:3000 │   │/cdn   │
└───┬──┘     └───┬──┘   └───────┘
    │            │
┌───▼────────────▼──┐
│  Django Backend   │
│  + TensorFlow     │
└────────┬──────────┘
         │
    ┌────┴─────┬──────────┐
    │           │          │
┌───▼──┐   ┌──▼───┐   ┌──▼──┐
│  DB  │   │Redis │   │FS   │
│ Prod │   │Cache │   │Files│
└──────┘   └──────┘   └─────┘
```

## 🔧 Prérequis

- **Serveur**: VPS Linux (Ubuntu 20.04 LTS recommandé)
- **Docker**: Docker 20.10+ et Docker Compose 1.29+
- **Domaine**: stackwarriors.dev avec DNS configuré
- **Accès SSH**: Avec clé SSH configurée

## 📋 Checklist avant déploiement

- [ ] Domaine stackwarriors.dev pointe vers l'IP du serveur
- [ ] Ports 80 et 443 ouverts dans le firewall
- [ ] Certificat SSL Let's Encrypt disponible (ou sera généré automatiquement)
- [ ] Fichier `.env.production` configuré avec les secrets
- [ ] Database backup configuré
- [ ] Email SMTP fonctionnel

## 🚀 Déploiement Automatisé

### 1. Préparation du serveur

```bash
# SSH sur le serveur
ssh -i your-key.pem user@stackwarriors.dev

# Mettre à jour le système
sudo apt update && sudo apt upgrade -y

# Installer Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Installer Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Vérifier installation
docker --version
docker-compose --version
```

### 2. Cloner le dépôt

```bash
cd /home/user
git clone https://github.com/ruffinh22/oculomotor-tracker.git
cd oculomotor-tracker
```

### 3. Configurer l'environnement

```bash
# Copier et éditer le fichier de production
cp .env.example .env.production

# ⚠️ IMPORTANT: Éditer avec vos valeurs réelles
nano .env.production

# Configuration minimale requise:
# - SECRET_KEY: clé longue et aléatoire
# - DB_PASSWORD: mot de passe PostgreSQL fort
# - REDIS_PASSWORD: mot de passe Redis fort
# - EMAIL_HOST_PASSWORD: mot de passe email/SMTP
```

### 4. Générer les certificats SSL

```bash
# Créer les répertoires
mkdir -p certbot/conf certbot/www

# Générer le certificat Let's Encrypt
docker-compose -f docker-compose.production.yml run --rm certbot

# Vérifier le certificat
ls -la certbot/conf/live/stackwarriors.dev/
```

### 5. Déployer avec le script

```bash
# Rendre le script exécutable
chmod +x deploy.sh

# Lancer le déploiement
./deploy.sh production

# Le script va:
# - Récupérer le dernier code
# - Construire les images Docker
# - Arrêter les anciens conteneurs
# - Démarrer les nouveaux services
# - Exécuter les migrations DB
# - Collecter les fichiers statiques
# - Recharger Nginx
```

## 🐳 Commandes Docker utiles

```bash
# Voir le statut des services
docker-compose -f docker-compose.production.yml ps

# Voir les logs en temps réel
docker-compose -f docker-compose.production.yml logs -f backend
docker-compose -f docker-compose.production.yml logs -f frontend
docker-compose -f docker-compose.production.yml logs -f nginx

# Exécuter une commande Django
docker-compose -f docker-compose.production.yml exec backend python manage.py createsuperuser

# Accéder à la base de données
docker-compose -f docker-compose.production.yml exec db psql -U tracker -d oculomotor_prod

# Redémarrer un service
docker-compose -f docker-compose.production.yml restart backend

# Arrêter tous les services
docker-compose -f docker-compose.production.yml down

# Supprimer les volumes (ATTENTION: perte de données!)
docker-compose -f docker-compose.production.yml down -v
```

## 🔄 Mises à Jour

### Mise à jour du code

```bash
# Pull les derniers changements
git pull origin master

# Reconstruire les images
docker-compose -f docker-compose.production.yml build

# Redémarrer les services
docker-compose -f docker-compose.production.yml up -d

# Exécuter les migrations (si nécessaire)
docker-compose -f docker-compose.production.yml exec backend python manage.py migrate
```

### Mise à jour des certificats SSL

```bash
# Les certificats Let's Encrypt sont valides 90 jours
# Docker va renouveler automatiquement via Certbot

# Pour forcer le renouvellement:
docker-compose -f docker-compose.production.yml run --rm certbot renew --force-renewal
```

## 📊 Monitoring & Logs

### Logs d'erreurs

```bash
# Voir les erreurs Nginx
docker-compose -f docker-compose.production.yml logs nginx | grep ERROR

# Voir les erreurs Django
docker-compose -f docker-compose.production.yml logs backend | grep ERROR

# Voir les erreurs Frontend
docker-compose -f docker-compose.production.yml logs frontend | grep ERROR
```

### Performance

```bash
# Voir l'utilisation des ressources
docker stats

# Voir les connexions réseau
ss -tulpn | grep LISTEN

# Voir l'utilisation du disque
df -h
du -sh /home/user/oculomotor-tracker/*
```

## 💾 Backup & Restauration

### Backup de la base de données

```bash
# Backup manuel
docker-compose -f docker-compose.production.yml exec db pg_dump -U tracker oculomotor_prod > backup-$(date +%Y%m%d-%H%M%S).sql

# Backup avec gzip
docker-compose -f docker-compose.production.yml exec db pg_dump -U tracker oculomotor_prod | gzip > backup-$(date +%Y%m%d-%H%M%S).sql.gz

# Backup vers AWS S3 (optionnel)
aws s3 cp backup-*.sql.gz s3://my-backup-bucket/
```

### Restaurer une base de données

```bash
# Restaurer depuis un backup
cat backup.sql | docker-compose -f docker-compose.production.yml exec -T db psql -U tracker -d oculomotor_prod

# Restaurer depuis un fichier gzip
gunzip -c backup.sql.gz | docker-compose -f docker-compose.production.yml exec -T db psql -U tracker -d oculomotor_prod
```

## 🔒 Sécurité

### Firewall

```bash
# UFW (Ubuntu)
sudo ufw enable
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw status
```

### Mises à jour de sécurité

```bash
# Configurer les mises à jour automatiques
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### Monitorer les accès

```bash
# Voir les connexions SSH
sudo tail -f /var/log/auth.log

# Voir les erreurs d'accès
sudo journalctl -u docker -f
```

## 📞 Troubleshooting

### Les services ne démarrent pas

```bash
# Vérifier les erreurs
docker-compose -f docker-compose.production.yml logs

# Vérifier si les ports sont disponibles
sudo ss -tulpn | grep -E ':(80|443|8000|3000|6379|5432)'

# Libérer un port
sudo lsof -i :PORT_NUMBER
sudo kill -9 PID
```

### Erreur CORS

```bash
# Vérifier CORS_ALLOWED_ORIGINS dans .env.production
grep CORS_ALLOWED_ORIGINS .env.production

# Redémarrer backend
docker-compose -f docker-compose.production.yml restart backend
```

### Certificat SSL expiré

```bash
# Vérifier la date d'expiration
openssl x509 -in certbot/conf/live/stackwarriors.dev/fullchain.pem -noout -dates

# Renouveler manuellement
docker-compose -f docker-compose.production.yml run --rm certbot renew --force-renewal
```

### Espace disque faible

```bash
# Nettoyer les images et conteneurs Docker
docker system prune -a

# Nettoyer les logs
docker exec $(docker ps -q -f ancestor=nginx:alpine) sh -c 'truncate -s 0 /var/log/nginx/*.log'
```

## ✅ Vérifier que le déploiement fonctionne

```bash
# Vérifier le health check
curl -k https://stackwarriors.dev/health

# Vérifier l'API
curl -k https://stackwarriors.dev/api/

# Vérifier la page d'accueil
curl -k https://stackwarriors.dev/

# Tester la connexion SSL
openssl s_client -connect stackwarriors.dev:443
```

## 📈 Prochaines étapes

1. **Monitoring**: Mettre en place Prometheus + Grafana
2. **CI/CD**: Ajouter GitHub Actions pour déploiement automatique
3. **Backup**: Configurer des backups automatiques vers S3
4. **Analytics**: Ajouter Google Analytics ou Plausible
5. **Support**: Mettre en place un système de ticketing

## 📧 Support

Pour toute question ou problème, créer une issue sur:
https://github.com/ruffinh22/oculomotor-tracker/issues

---

**Dernière mise à jour**: 2025-12-19 | **Version**: 1.0
