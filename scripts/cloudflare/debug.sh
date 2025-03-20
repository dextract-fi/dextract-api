#!/bin/bash
# Extract debug information for Dextract-fi API on Cloudflare Workers

# Check if environment is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <environment>"
  echo "Environments: production, development"
  exit 1
fi

ENVIRONMENT=$1

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Extracting debug information for Dextract-fi API (${ENVIRONMENT})...${NC}"

# Create a debug directory if it doesn't exist
DEBUG_DIR="debug/$(date +%Y-%m-%d_%H-%M-%S)"
mkdir -p $DEBUG_DIR

# Get worker information
echo -e "${YELLOW}Worker information:${NC}"
npx wrangler info --env $ENVIRONMENT | tee "$DEBUG_DIR/worker-info.txt"

# Get KV namespace information
echo -e "\n${YELLOW}KV namespace information:${NC}"
npx wrangler kv:namespace list | tee "$DEBUG_DIR/kv-namespaces.txt"

# Get recent logs (limited to 10 minutes to avoid excessive output)
echo -e "\n${YELLOW}Recent logs (last 10 minutes):${NC}"
npx wrangler tail --env $ENVIRONMENT --format json --timeout 600 | tee "$DEBUG_DIR/recent-logs.json"

# Get environment variables (excluding secrets)
echo -e "\n${YELLOW}Environment variables:${NC}"
npx wrangler var list --env $ENVIRONMENT | tee "$DEBUG_DIR/environment-vars.txt"

# Get routes
echo -e "\n${YELLOW}Routes:${NC}"
npx wrangler route list | tee "$DEBUG_DIR/routes.txt"

echo -e "\n${GREEN}Debug information extraction complete!${NC}"
echo -e "${GREEN}Debug information saved to: ${DEBUG_DIR}${NC}"