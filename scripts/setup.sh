#!/bin/bash
# Setup script for Dextract-fi API

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Setting up Dextract-fi API...${NC}"

# Make all scripts executable
echo -e "${YELLOW}Making scripts executable...${NC}"
chmod +x scripts/docker/*.sh
chmod +x scripts/cloudflare/*.sh
chmod +x scripts/setup.sh

# Create .env.local if it doesn't exist
if [ ! -f ".env.local" ]; then
  echo -e "${YELLOW}Creating .env.local from .env.example...${NC}"
  cp .env.example .env.local
  echo -e "${GREEN}.env.local created. Please update it with your local settings.${NC}"
fi

# Create debug directory if it doesn't exist
if [ ! -d "debug" ]; then
  echo -e "${YELLOW}Creating debug directory...${NC}"
  mkdir -p debug
fi

# Create .miniflare directory if it doesn't exist
if [ ! -d ".miniflare" ]; then
  echo -e "${YELLOW}Creating .miniflare directory...${NC}"
  mkdir -p .miniflare/kv
fi

# Check if Docker is installed
if command -v docker &> /dev/null; then
  echo -e "${GREEN}Docker is installed.${NC}"
else
  echo -e "${RED}Docker is not installed. Please install Docker to use the Docker Compose setup.${NC}"
fi

# Check if Docker Compose is installed
if command -v docker-compose &> /dev/null; then
  echo -e "${GREEN}Docker Compose is installed.${NC}"
else
  echo -e "${RED}Docker Compose is not installed. Please install Docker Compose to use the Docker Compose setup.${NC}"
fi

# Check if wrangler is installed
if command -v wrangler &> /dev/null || npx wrangler --version &> /dev/null; then
  echo -e "${GREEN}Wrangler is installed.${NC}"
else
  echo -e "${RED}Wrangler is not installed. Please install Wrangler to deploy to Cloudflare Workers.${NC}"
  echo -e "${YELLOW}You can install Wrangler with: npm install -g wrangler${NC}"
fi

echo -e "${GREEN}Setup complete!${NC}"
echo -e "${YELLOW}Available commands:${NC}"
echo -e "${GREEN}Local development:${NC}"
echo -e "  scripts/docker/start.sh      - Start Docker Compose services"
echo -e "  scripts/docker/stop.sh       - Stop Docker Compose services"
echo -e "  scripts/docker/logs.sh       - Show Docker Compose logs"
echo -e "  scripts/docker/rebuild.sh    - Rebuild Docker Compose services"
echo -e "${GREEN}Cloudflare deployment:${NC}"
echo -e "  scripts/cloudflare/deploy.sh  - Deploy to Cloudflare Workers"
echo -e "  scripts/cloudflare/debug.sh   - Extract debug information"
echo -e "  scripts/cloudflare/secrets.sh - Manage secrets"