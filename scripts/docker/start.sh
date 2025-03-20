#!/bin/bash
# Start Dextract-fi API with Docker Compose

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting Dextract-fi API with Docker Compose...${NC}"

# Load environment variables
if [ -f ".env.development" ]; then
  echo -e "${YELLOW}Loading environment variables from .env.development...${NC}"
  export $(grep -v '^#' .env.development | xargs)
fi

if [ -f ".env.local" ]; then
  echo -e "${YELLOW}Loading local environment variables from .env.local...${NC}"
  export $(grep -v '^#' .env.local | xargs)
fi

# Start Docker Compose services
docker-compose up -d

# Check if services started successfully
if [ $? -eq 0 ]; then
  echo -e "${GREEN}Services started successfully!${NC}"
  echo -e "${GREEN}API is now available at: http://localhost:${API_PORT:-8787}${NC}"
  echo -e "${GREEN}Monitoring is available at: http://localhost:${MONITORING_PORT:-3000}${NC}"
else
  echo -e "${RED}Failed to start services!${NC}"
  exit 1
fi

# Show logs
echo -e "${YELLOW}Showing logs (press Ctrl+C to exit)...${NC}"
docker-compose logs -f