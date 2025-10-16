#!/bin/bash

# SwitcherFi Bill Payment Contract V2 Deployment Script
# Features: Escrow pattern with confirm/refund functionality

set -e  # Exit on error

echo "========================================="
echo "🚀 SwitcherFi Contract V2 Deployment"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if sui CLI is installed
if ! command -v sui &> /dev/null; then
    echo -e "${RED}❌ Error: sui CLI not found${NC}"
    echo "Please install Sui CLI: https://docs.sui.io/build/install"
    exit 1
fi

# Check current network
CURRENT_NETWORK=$(sui client active-env)
echo -e "${BLUE}📡 Current Network: ${CURRENT_NETWORK}${NC}"

if [ "$CURRENT_NETWORK" != "testnet" ]; then
    echo -e "${YELLOW}⚠️  Warning: Not on testnet. Switch to testnet? (y/n)${NC}"
    read -r response
    if [ "$response" = "y" ]; then
        sui client switch --env testnet
        echo -e "${GREEN}✅ Switched to testnet${NC}"
    else
        echo -e "${RED}❌ Deployment cancelled${NC}"
        exit 1
    fi
fi

# Get current address
DEPLOYER_ADDRESS=$(sui client active-address)
echo -e "${BLUE}👤 Deployer Address: ${DEPLOYER_ADDRESS}${NC}"
echo ""

# Check balance
echo -e "${BLUE}💰 Checking SUI balance...${NC}"
BALANCE=$(sui client gas --json | jq -r '.[0].mistBalance // 0')
BALANCE_SUI=$((BALANCE / 1000000000))

if [ "$BALANCE_SUI" -lt 1 ]; then
    echo -e "${RED}❌ Insufficient balance: ${BALANCE_SUI} SUI${NC}"
    echo "Please fund your wallet with testnet SUI from: https://faucet.sui.io"
    exit 1
fi

echo -e "${GREEN}✅ Balance: ${BALANCE_SUI} SUI${NC}"
echo ""

# Build the contract
echo -e "${BLUE}🔨 Building contract...${NC}"
cd "$(dirname "$0")"
sui move build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build successful${NC}"
echo ""

# Deploy the contract
echo -e "${BLUE}🚀 Deploying contract to testnet...${NC}"
echo ""

DEPLOY_OUTPUT=$(sui client publish --gas-budget 100000000 --json)

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Deployment successful!${NC}"
echo ""

# Parse deployment output
PACKAGE_ID=$(echo "$DEPLOY_OUTPUT" | jq -r '.objectChanges[] | select(.type == "published") | .packageId')
CONTRACT_ID=$(echo "$DEPLOY_OUTPUT" | jq -r '.objectChanges[] | select(.objectType | contains("BillPaymentContract")) | .objectId')
ADMIN_CAP_ID=$(echo "$DEPLOY_OUTPUT" | jq -r '.objectChanges[] | select(.objectType | contains("AdminCap")) | .objectId')
UPGRADE_CAP_ID=$(echo "$DEPLOY_OUTPUT" | jq -r '.objectChanges[] | select(.objectType | contains("UpgradeCap")) | .objectId')
TX_DIGEST=$(echo "$DEPLOY_OUTPUT" | jq -r '.digest')

# Display results
echo "========================================="
echo "📋 Deployment Results"
echo "========================================="
echo ""
echo -e "${GREEN}Package ID:${NC}       $PACKAGE_ID"
echo -e "${GREEN}Contract ID:${NC}      $CONTRACT_ID"
echo -e "${GREEN}Admin Cap ID:${NC}     $ADMIN_CAP_ID"
echo -e "${GREEN}Upgrade Cap ID:${NC}   $UPGRADE_CAP_ID"
echo -e "${GREEN}Transaction:${NC}      $TX_DIGEST"
echo ""
echo -e "${BLUE}Explorer:${NC} https://suiexplorer.com/txblock/${TX_DIGEST}?network=testnet"
echo ""

# Create environment file
ENV_FILE="../.env.deployment"
echo "# SwitcherFi V2 Contract Deployment" > "$ENV_FILE"
echo "# Generated on $(date)" >> "$ENV_FILE"
echo "" >> "$ENV_FILE"
echo "NEXT_PUBLIC_CONTRACT_PACKAGE_ID=$PACKAGE_ID" >> "$ENV_FILE"
echo "NEXT_PUBLIC_CONTRACT_OBJECT_ID=$CONTRACT_ID" >> "$ENV_FILE"
echo "NEXT_PUBLIC_ADMIN_CAP_ID=$ADMIN_CAP_ID" >> "$ENV_FILE"
echo "NEXT_PUBLIC_UPGRADE_CAP_ID=$UPGRADE_CAP_ID" >> "$ENV_FILE"
echo "NEXT_PUBLIC_ADMIN_WALLET=$DEPLOYER_ADDRESS" >> "$ENV_FILE"
echo "" >> "$ENV_FILE"

echo -e "${GREEN}✅ Environment variables saved to .env.deployment${NC}"
echo ""

# Instructions
echo "========================================="
echo "📝 Next Steps"
echo "========================================="
echo ""
echo "1. Copy the environment variables to your .env.local:"
echo -e "   ${YELLOW}cat .env.deployment >> .env.local${NC}"
echo ""
echo "2. Set ClubKonnect credentials on the contract:"
echo -e "   ${YELLOW}sui client call \\${NC}"
echo -e "     ${YELLOW}--package $PACKAGE_ID \\${NC}"
echo -e "     ${YELLOW}--module bill_payment \\${NC}"
echo -e "     ${YELLOW}--function set_clubkonnect_credentials \\${NC}"
echo -e "     ${YELLOW}--args $CONTRACT_ID $ADMIN_CAP_ID \\${NC}"
echo -e "     ${YELLOW}       \"YOUR_USER_ID\" \"YOUR_API_KEY\" \\${NC}"
echo -e "     ${YELLOW}       \"https://www.nellobytesystems.com\" \\${NC}"
echo -e "     ${YELLOW}       0x6 \\${NC}"
echo -e "     ${YELLOW}--gas-budget 10000000${NC}"
echo ""
echo "3. Restart your development server:"
echo -e "   ${YELLOW}npm run dev${NC}"
echo ""
echo "4. Test the new escrow functionality:"
echo -e "   - Purchase airtime (payment held in escrow)"
echo -e "   - Check pending payments in admin dashboard"
echo -e "   - Confirm or refund payments"
echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo "========================================="

