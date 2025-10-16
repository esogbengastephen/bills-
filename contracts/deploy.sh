#!/bin/bash

# Bill Payment Smart Contract Deployment Script
# This script deploys the bill payment contract to Sui testnet

set -e

echo "🚀 Deploying Bill Payment Smart Contract to Sui Testnet..."

# Check if sui CLI is installed
if ! command -v sui &> /dev/null; then
    echo "❌ Sui CLI not found. Please install it first:"
    echo "   cargo install --locked --git https://github.com/MystenLabs/sui.git --tag mainnet-v1.18.0 sui"
    exit 1
fi

# Check if we're in the contracts directory
if [ ! -f "Move.toml" ]; then
    echo "❌ Move.toml not found. Please run this script from the contracts directory."
    exit 1
fi

# Set network to testnet
echo "📡 Setting network to testnet..."
sui client new-env --alias testnet --rpc https://fullnode.testnet.sui.io:443

# Build the contract
echo "🔨 Building contract..."
sui move build

# Deploy the contract
echo "🚀 Deploying contract to testnet..."
DEPLOY_RESULT=$(sui client publish --gas-budget 100000000 --json)

# Extract contract address and package ID
CONTRACT_ADDRESS=$(echo $DEPLOY_RESULT | jq -r '.objectChanges[] | select(.type == "published") | .packageId')
ADMIN_CAP_ID=$(echo $DEPLOY_RESULT | jq -r '.objectChanges[] | select(.type == "created" and .objectType | contains("AdminCap")) | .objectId')
UPGRADE_CAP_ID=$(echo $DEPLOY_RESULT | jq -r '.objectChanges[] | select(.type == "created" and .objectType | contains("UpgradeCap")) | .objectId')
CONTRACT_ID=$(echo $DEPLOY_RESULT | jq -r '.objectChanges[] | select(.type == "created" and .objectType | contains("BillPaymentContract")) | .objectId')

echo "✅ Contract deployed successfully!"
echo ""
echo "📋 Deployment Details:"
echo "   Contract Package ID: $CONTRACT_ADDRESS"
echo "   Contract Object ID: $CONTRACT_ID"
echo "   Admin Cap ID: $ADMIN_CAP_ID"
echo "   Upgrade Cap ID: $UPGRADE_CAP_ID"
echo ""
echo "🔧 Next Steps:"
echo "   1. Set ClubKonnect credentials:"
echo "      sui client call --package $CONTRACT_ADDRESS --module bill_payment --function set_clubkonnect_credentials --args $CONTRACT_ID $ADMIN_CAP_ID \"CK101264658\" \"R6IN53ZKT2Y9F5X9Z8V99127B8W480397T9580YNUM4C44TYQQ380KMZFV0Y8YJL\" \"https://www.nellobytesystems.com\" --gas-budget 10000000"
echo ""
echo "   2. Add treasury funds:"
echo "      sui client call --package $CONTRACT_ADDRESS --module bill_payment --function add_treasury_funds --args $CONTRACT_ID $ADMIN_CAP_ID <COIN_OBJECT_ID> --gas-budget 10000000"
echo ""
echo "   3. Test airtime purchase:"
echo "      sui client call --package $CONTRACT_ADDRESS --module bill_payment --function purchase_airtime --args $CONTRACT_ID <PAYMENT_COIN> \"mtn\" \"09076685067\" 100 <CLOCK_OBJECT> --gas-budget 10000000"
echo ""
echo "📝 Update your .env.local file with:"
echo "   NEXT_PUBLIC_CONTRACT_PACKAGE_ID=$CONTRACT_ADDRESS"
echo "   NEXT_PUBLIC_CONTRACT_OBJECT_ID=$CONTRACT_ID"
echo "   NEXT_PUBLIC_ADMIN_CAP_ID=$ADMIN_CAP_ID"
echo "   NEXT_PUBLIC_UPGRADE_CAP_ID=$UPGRADE_CAP_ID"

# Save deployment info to file
cat > deployment_info.json << EOF
{
  "contract_package_id": "$CONTRACT_ADDRESS",
  "contract_object_id": "$CONTRACT_ID",
  "admin_cap_id": "$ADMIN_CAP_ID",
  "upgrade_cap_id": "$UPGRADE_CAP_ID",
  "network": "testnet",
  "deployed_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

echo ""
echo "💾 Deployment info saved to deployment_info.json"
