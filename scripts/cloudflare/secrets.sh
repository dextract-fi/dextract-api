#!/bin/bash
# Manage secrets for Dextract-fi API on Cloudflare Workers

# Check if environment is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <environment> [action] [secret_name] [secret_value]"
  echo "Environments: production, development"
  echo "Actions: list, get, set, delete"
  echo "Examples:"
  echo "  $0 production list"
  echo "  $0 production set COINGECKO_API_KEY your_api_key"
  echo "  $0 production delete COINGECKO_API_KEY"
  exit 1
fi

ENVIRONMENT=$1
ACTION=${2:-"list"}
SECRET_NAME=$3
SECRET_VALUE=$4

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Managing secrets for Dextract-fi API (${ENVIRONMENT})...${NC}"

case $ACTION in
  list)
    echo -e "${YELLOW}Listing secrets:${NC}"
    npx wrangler secret list --env $ENVIRONMENT
    ;;
    
  get)
    if [ -z "$SECRET_NAME" ]; then
      echo -e "${RED}Error: Secret name is required for 'get' action${NC}"
      exit 1
    fi
    
    echo -e "${YELLOW}Getting secret: ${SECRET_NAME}${NC}"
    echo -e "${RED}Note: Cloudflare Workers doesn't support retrieving secret values${NC}"
    echo -e "${YELLOW}You can only check if a secret exists:${NC}"
    npx wrangler secret list --env $ENVIRONMENT | grep -q "$SECRET_NAME" && \
      echo -e "${GREEN}Secret ${SECRET_NAME} exists${NC}" || \
      echo -e "${RED}Secret ${SECRET_NAME} does not exist${NC}"
    ;;
    
  set)
    if [ -z "$SECRET_NAME" ]; then
      echo -e "${RED}Error: Secret name is required for 'set' action${NC}"
      exit 1
    fi
    
    if [ -z "$SECRET_VALUE" ]; then
      echo -e "${YELLOW}No secret value provided. Reading from stdin...${NC}"
      echo -e "${YELLOW}Enter secret value (press Ctrl+D when done):${NC}"
      echo -n "$(cat)" | npx wrangler secret put "$SECRET_NAME" --env $ENVIRONMENT
    else
      echo -e "${YELLOW}Setting secret: ${SECRET_NAME}${NC}"
      echo -n "$SECRET_VALUE" | npx wrangler secret put "$SECRET_NAME" --env $ENVIRONMENT
    fi
    ;;
    
  delete)
    if [ -z "$SECRET_NAME" ]; then
      echo -e "${RED}Error: Secret name is required for 'delete' action${NC}"
      exit 1
    fi
    
    echo -e "${YELLOW}Deleting secret: ${SECRET_NAME}${NC}"
    npx wrangler secret delete "$SECRET_NAME" --env $ENVIRONMENT
    ;;
    
  *)
    echo -e "${RED}Error: Unknown action '${ACTION}'${NC}"
    echo "Valid actions: list, get, set, delete"
    exit 1
    ;;
esac

echo -e "${GREEN}Secret management complete!${NC}"