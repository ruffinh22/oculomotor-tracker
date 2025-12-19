#!/bin/bash

# Deployment script for stackwarriors.dev
# Usage: ./deploy.sh [production|staging]

set -e

ENVIRONMENT=${1:-production}
DOMAIN="stackwarriors.dev"

echo "🚀 Deployment script for $DOMAIN ($ENVIRONMENT)"
echo "================================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f ".env.$ENVIRONMENT" ]; then
    echo -e "${RED}❌ .env.$ENVIRONMENT not found!${NC}"
    exit 1
fi

# Load environment
source ".env.$ENVIRONMENT"

echo -e "${YELLOW}📦 Step 1: Pulling latest code from GitHub${NC}"
git pull origin master

echo -e "${YELLOW}🔨 Step 2: Building Docker images${NC}"
docker-compose -f docker-compose.$ENVIRONMENT.yml build

echo -e "${YELLOW}🌍 Step 3: Stopping old containers${NC}"
docker-compose -f docker-compose.$ENVIRONMENT.yml down

echo -e "${YELLOW}🚀 Step 4: Starting services${NC}"
docker-compose -f docker-compose.$ENVIRONMENT.yml up -d

echo -e "${YELLOW}⏳ Waiting for services to be healthy...${NC}"
sleep 10

echo -e "${YELLOW}📊 Step 5: Running database migrations${NC}"
docker-compose -f docker-compose.$ENVIRONMENT.yml exec -T backend python manage.py migrate

echo -e "${YELLOW}🗂️ Step 6: Collecting static files${NC}"
docker-compose -f docker-compose.$ENVIRONMENT.yml exec -T backend python manage.py collectstatic --noinput

echo -e "${YELLOW}🔒 Step 7: Setting up SSL certificates${NC}"
if [ ! -d "certbot/conf/live/$DOMAIN" ]; then
    echo "Generating SSL certificate for $DOMAIN..."
    docker-compose -f docker-compose.$ENVIRONMENT.yml run --rm certbot
else
    echo "SSL certificate already exists, skipping..."
fi

echo -e "${YELLOW}✅ Step 8: Reloading Nginx${NC}"
docker-compose -f docker-compose.$ENVIRONMENT.yml exec -T nginx nginx -s reload

echo -e "${YELLOW}📊 Service Status:${NC}"
docker-compose -f docker-compose.$ENVIRONMENT.yml ps

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo ""
echo "Access your application:"
echo "  🌐 Frontend: https://$DOMAIN"
echo "  📡 API: https://$DOMAIN/api"
echo "  🔧 Admin: https://$DOMAIN/admin"
echo ""
echo "View logs:"
echo "  docker-compose -f docker-compose.$ENVIRONMENT.yml logs -f backend"
echo "  docker-compose -f docker-compose.$ENVIRONMENT.yml logs -f frontend"
echo "  docker-compose -f docker-compose.$ENVIRONMENT.yml logs -f nginx"
