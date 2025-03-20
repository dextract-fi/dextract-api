#!/bin/bash
# Show logs for Dextract-fi API Docker Compose services

# Set colors for output
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if service name is provided
if [ -z "$1" ]; then
  echo -e "${YELLOW}Showing logs for all services (press Ctrl+C to exit)...${NC}"
  docker-compose logs -f
else
  echo -e "${YELLOW}Showing logs for $1 service (press Ctrl+C to exit)...${NC}"
  docker-compose logs -f $1
fi