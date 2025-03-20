#!/bin/bash
# Rebuild Dextract-fi API Docker Compose services

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Rebuilding Dextract-fi API services...${NC}"

# Stop services if they're running
echo -e "${YELLOW}Stopping services if they're running...${NC}"
docker-compose down

# Rebuild and start services
echo -e "${YELLOW}Rebuilding and starting services...${NC}"
docker-compose up -d --build

# Check if services started successfully
if [ $? -eq 0 ]; then
  echo -e "${GREEN}Services rebuilt and started successfully!${NC}"
  echo -e "${GREEN}API is now available at: http://localhost:${API_PORT:-8787}${NC}"
else
  echo -e "${RED}Failed to rebuild services!${NC}"
  exit 1
fi

# Show logs
echo -e "${YELLOW}Showing logs (press Ctrl+C to exit)...${NC}"
docker-compose logs -f