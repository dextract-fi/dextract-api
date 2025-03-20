#!/bin/bash
# Deployment script for Dextract-fi API to Cloudflare Workers

# Exit on error
set -e

# Check if environment is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <environment>"
  echo "Environments: production, staging"
  exit 1
fi

ENVIRONMENT=$1

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Deploying Dextract-fi API to Cloudflare Workers (${ENVIRONMENT})...${NC}"

# Build the application
echo -e "${YELLOW}Building application...${NC}"
npm run build

# Check if KV namespace ID is set
if grep -q "YOUR_KV_NAMESPACE_ID_HERE" wrangler.toml; then
  echo -e "${RED}Error: KV namespace ID is not set in wrangler.toml${NC}"
  echo "Please set your KV namespace ID in wrangler.toml"
  exit 1
fi

# Check if zone ID is set
if grep -q "YOUR_ZONE_ID_HERE" wrangler.toml; then
  echo -e "${RED}Error: Zone ID is not set in wrangler.toml${NC}"
  echo "Please set your zone ID in wrangler.toml"
  exit 1
fi

# Deploy to Cloudflare Workers
echo -e "${YELLOW}Deploying to Cloudflare Workers...${NC}"
npx wrangler deploy --env $ENVIRONMENT

# Verify deployment
if [ $? -eq 0 ]; then
  echo -e "${GREEN}Deployment successful!${NC}"
  
  # Output the URL
  if [ "$ENVIRONMENT" == "production" ]; then
    echo -e "${GREEN}API is now available at: https://api.dextract.fi${NC}"
  else
    echo -e "${GREEN}API is now available at the Workers.dev URL shown above${NC}"
  fi
  
  # Remind about secrets
  echo -e "${YELLOW}Remember to set your API keys as secrets:${NC}"
  echo "npx wrangler secret put COINGECKO_API_KEY --env $ENVIRONMENT"
  echo "npx wrangler secret put COINMARKETCAP_API_KEY --env $ENVIRONMENT"
else
  echo -e "${RED}Deployment failed!${NC}"
  exit 1
fi