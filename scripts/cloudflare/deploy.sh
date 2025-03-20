#!/bin/bash
# Deploy Dextract-fi API to Cloudflare Workers

# Exit on error
set -e

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

echo -e "${YELLOW}Deploying Dextract-fi API to Cloudflare Workers (${ENVIRONMENT})...${NC}"

# Load environment variables
if [ -f ".env.${ENVIRONMENT}" ]; then
  echo -e "${YELLOW}Loading environment variables from .env.${ENVIRONMENT}...${NC}"
  export $(grep -v '^#' .env.${ENVIRONMENT} | xargs)
fi

if [ -f ".env.local" ]; then
  echo -e "${YELLOW}Loading local environment variables from .env.local...${NC}"
  export $(grep -v '^#' .env.local | xargs)
fi

# Check if KV namespace ID is set
if [ -z "${KV_NAMESPACE_ID}" ]; then
  echo -e "${RED}Error: KV_NAMESPACE_ID environment variable is not set${NC}"
  echo "Please set KV_NAMESPACE_ID in your .env.${ENVIRONMENT} or .env.local file"
  exit 1
fi

# Build the application
echo -e "${YELLOW}Building application...${NC}"
pnpm run build

# Deploy to Cloudflare Workers
echo -e "${YELLOW}Deploying to Cloudflare Workers...${NC}"
KV_NAMESPACE_ID=${KV_NAMESPACE_ID} KV_PREVIEW_NAMESPACE_ID=${KV_PREVIEW_NAMESPACE_ID:-${KV_NAMESPACE_ID}} npx wrangler deploy --env $ENVIRONMENT

# Verify deployment
if [ $? -eq 0 ]; then
  echo -e "${GREEN}Deployment successful!${NC}"
  
  # Output the URL
  if [ "$ENVIRONMENT" == "production" ]; then
    echo -e "${GREEN}API is now available at: https://api.dextract.xyz${NC}"
  else
    echo -e "${GREEN}API is now available at the Workers.dev URL shown above${NC}"
  fi
  
  # Remind about secrets
  echo -e "${YELLOW}Checking if secrets need to be updated...${NC}"
  
  # List of secrets to check
  SECRETS=("COINGECKO_API_KEY" "COINMARKETCAP_API_KEY")
  
  for SECRET in "${SECRETS[@]}"; do
    if [ -n "${!SECRET}" ]; then
      echo -e "${YELLOW}Setting secret: ${SECRET}${NC}"
      echo "${!SECRET}" | npx wrangler secret put ${SECRET} --env $ENVIRONMENT
    else
      echo -e "${YELLOW}Warning: ${SECRET} is not set in environment variables${NC}"
    fi
  done
  
  echo -e "${GREEN}Deployment complete!${NC}"
else
  echo -e "${RED}Deployment failed!${NC}"
  exit 1
fi