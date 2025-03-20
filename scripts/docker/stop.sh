#!/bin/bash
# Stop Dextract-fi API Docker Compose services

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Stopping Dextract-fi API services...${NC}"

# Stop Docker Compose services
docker-compose down

# Check if services stopped successfully
if [ $? -eq 0 ]; then
  echo -e "${GREEN}Services stopped successfully!${NC}"
else
  echo -e "${RED}Failed to stop services!${NC}"
  exit 1
fi