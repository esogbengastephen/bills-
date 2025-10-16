# 🔒 Escrow System Deployment Guide

## Overview

This guide covers the deployment and setup of the **SwitcherFi V2 Escrow System**, which implements secure payment holding until ClubKonnect confirms successful service delivery.

---

## 🎯 Key Features

### What Changed from V1 to V2

| Feature | V1 (Old) | V2 (New - Escrow) |
|---------|----------|-------------------|
| **Payment Flow** | Immediate transfer to admin | Held in escrow until confirmed |
| **Refunds** | Not supported | Automatic refunds on failure |
| **User Protection** | ❌ None | ✅ Full refund if service fails |
| **Admin Control** | Limited | Confirm/refund/claim expired |
| **Gas Efficiency** | User pays 1x | User 1x, Admin 1x |
| **Expiry** | None | 30 minutes auto-expiry |

---

## 📋 Prerequisites

Before deploying, ensure you have:

- [ ] Sui CLI installed and configured
- [ ] Active testnet wallet with SUI balance (≥2 SUI recommended)
- [ ] Node.js 18+ and npm installed
- [ ] ClubKonnect API credentials
- [ ] Git repository access
- [ ] Admin wallet private key (for automated confirms - optional)

---

## 🚀 Deployment Steps

### Step 1: Backup Current System

```bash
# Navigate to project root
cd /Users/flash/Desktop/speeder

# Backup current contract
cp contracts/sources/bill_payment.move contracts/sources/bill_payment_v1_backup.move

# Backup environment variables (if .env.local exists)
cp .env.local .env.local.backup 2>/dev/null || echo "No .env.local found"

# Backup database
cp prisma/dev.db prisma/dev.db.backup
```

### Step 2: Verify Contract Build

```bash
cd contracts

# Build the new escrow contract
sui move build

# Expected output: ✅ Build successful
```

If build fails, check:
- Sui CLI version: `sui --version` (should be latest)
- Move.toml configuration
- No syntax errors in bill_payment.move

### Step 3: Deploy to Testnet

```bash
# Make deploy script executable
chmod +x deploy-v2.sh

# Run deployment
./deploy-v2.sh
```

**What This Does:**
1. Checks Sui CLI installation
2. Verifies you're on testnet
3. Checks wallet balance (≥1 SUI required)
4. Builds contract
5. Deploys to Sui testnet
6. Saves deployment info to `.env.deployment`

**Expected Output:**
```
========================================
🚀 SwitcherFi Contract V2 Deployment
========================================

📡 Current Network: testnet
👤 Deployer Address: 0x8471...0580
💰 Balance: 5 SUI
🔨 Building contract...
✅ Build successful
🚀 Deploying contract to testnet...
✅ Deployment successful!

========================================
📋 Deployment Results
========================================

Package ID:       0xabc123...
Contract ID:      0xdef456...
Admin Cap ID:     0x789abc...
Upgrade Cap ID:   0x012def...
Transaction:      GHI789...
```

### Step 4: Update Environment Variables

```bash
# Copy deployment variables to .env.local
cat .env.deployment >> .env.local

# Edit .env.local to add required variables
nano .env.local
```

**Required Variables:**
```bash
# Smart Contract (from deployment)
NEXT_PUBLIC_CONTRACT_PACKAGE_ID=0x...
NEXT_PUBLIC_CONTRACT_OBJECT_ID=0x...
NEXT_PUBLIC_ADMIN_CAP_ID=0x...
NEXT_PUBLIC_UPGRADE_CAP_ID=0x...
NEXT_PUBLIC_ADMIN_WALLET=0x...

# ClubKonnect
CLUBKONNECT_API_URL=https://www.nellobytesystems.com
CLUBKONNECT_USER_ID=CK101264658
CLUBKONNECT_API_KEY=your_api_key

# Mock Mode (for testing without balance)
CLUBKONNECT_MOCK_MODE=true

# Database
DATABASE_URL="file:./prisma/dev.db"

# Optional: Auto-confirm payments (requires admin private key)
AUTO_CONFIRM_PAYMENTS=false
ADMIN_WALLET_PRIVATE_KEY=  # Leave empty for manual processing

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### Step 5: Set ClubKonnect Credentials on Contract

```bash
sui client call \
  --package <PACKAGE_ID> \
  --module bill_payment \
  --function set_clubkonnect_credentials \
  --args \
    <CONTRACT_ID> \
    <ADMIN_CAP_ID> \
    "CK101264658" \
    "YOUR_API_KEY" \
    "https://www.nellobytesystems.com" \
    0x6 \
  --gas-budget 10000000
```

Replace:
- `<PACKAGE_ID>` with your package ID
- `<CONTRACT_ID>` with your contract ID
- `<ADMIN_CAP_ID>` with your admin cap ID
- `YOUR_API_KEY` with actual ClubKonnect API key

**Verify credentials were set:**
```bash
sui client call \
  --package <PACKAGE_ID> \
  --module bill_payment \
  --function has_credentials \
  --args <CONTRACT_ID> \
  --gas-budget 1000000
```

### Step 6: Update Database Schema

```bash
cd /Users/flash/Desktop/speeder

# Generate Prisma client with new schema
npx prisma generate

# Push schema changes to database
npx prisma db push

# Expected output:
# ✔ Generated Prisma Client
# 🚀 Your database is now in sync with your Prisma schema
```

### Step 7: Restart Development Server

```bash
# Stop current server (if running)
# Press Ctrl+C in terminal running npm run dev

# Clear Next.js cache
rm -rf .next/

# Restart server
npm run dev
```

---

## 🧪 Testing the Escrow System

### Test 1: Purchase with Escrow Hold

1. **Navigate to Airtime Purchase**
   - Go to http://localhost:3000/airtime-purchase

2. **Make a Test Purchase**
   - Select network: MTN
   - Phone: 07034494055
   - Amount: ₦100
   - Connect wallet
   - Click "Purchase Airtime"

3. **Expected Behavior:**
   - ✅ Transaction submitted to blockchain
   - ✅ Payment held in escrow (NOT sent to admin yet)
   - ✅ Transaction logged as "pending"
   - ✅ Mock mode: ClubKonnect returns success

4. **Check Blockchain:**
   ```bash
   # View transaction on Sui Explorer
   # Look for PaymentPending event
   ```

### Test 2: Confirm Payment (Admin)

1. **Go to Admin Dashboard**
   - Navigate to http://localhost:3000/admin-dashboard
   - Connect admin wallet

2. **Find Pending Payment**
   - Look for transaction with status "pending"
   - Should show "Pending Payment Actions" section

3. **Confirm Payment**
   - Click "✅ Confirm & Release Funds"
   - Sign transaction
   - Wait for confirmation

4. **Expected Result:**
   - ✅ Funds released to admin wallet
   - ✅ Transaction status updated to "confirmed"
   - ✅ PaymentConfirmed event emitted

### Test 3: Refund Payment (Admin)

1. **Make Another Purchase**
   - Repeat Test 1 steps

2. **Initiate Refund**
   - In admin dashboard, click "🔄 Refund to User"
   - Enter reason: "ClubKonnect service failed"
   - Click "Confirm Refund"

3. **Expected Result:**
   - ✅ Funds returned to user wallet
   - ✅ Transaction status updated to "refunded"
   - ✅ PaymentRefunded event emitted

### Test 4: Callback Integration

1. **Test Callback Endpoint**
   ```bash
   curl http://localhost:3000/api/callback?test=true
   ```

   Expected response:
   ```json
   {
     "success": true,
     "message": "ClubKonnect callback endpoint is active",
     "auto_confirm_enabled": false,
     "features": {
       "database_logging": true,
       "auto_processing": false,
       "manual_processing": true
     }
   }
   ```

2. **Simulate ClubKonnect Callback**
   ```bash
   curl -X POST http://localhost:3000/api/callback \
     -H "Content-Type: application/json" \
     -d '{
       "orderid": "TEST_123",
       "statuscode": "200",
       "status": "ORDER_COMPLETED",
       "requestid": "SWF_1760612345678_abc123",
       "remark": "Test transaction successful"
     }'
   ```

   Expected:
   - ✅ Callback processed
   - ✅ Database updated
   - ✅ Manual action required (unless auto-confirm enabled)

---

## 🔍 Verification Checklist

After deployment, verify:

### Smart Contract
- [ ] Contract deployed and shared object created
- [ ] Admin cap transferred to deployer wallet
- [ ] ClubKonnect credentials set on contract
- [ ] `has_credentials()` returns true

### Frontend
- [ ] All environment variables set correctly
- [ ] Development server starts without errors
- [ ] Wallet connection works
- [ ] Purchase pages load correctly

### Database
- [ ] Schema updated with new fields
- [ ] `pendingPaymentId` column exists in transactions
- [ ] `clubkonnectOrderId` column exists
- [ ] Database migrations successful

### API Endpoints
- [ ] `/api/callback` returns 200 on GET ?test=true
- [ ] `/api/services` works for purchases
- [ ] `/api/database/transactions` returns data

### Admin Dashboard
- [ ] Admin wallet can connect
- [ ] Pending payments section displays
- [ ] Confirm/refund buttons appear
- [ ] Actions complete successfully

---

## 🐛 Troubleshooting

### Issue: Contract Build Fails

**Symptoms:**
```
error[E01001]: Invalid usage of module member
```

**Solution:**
1. Check Sui CLI version: `sui --version`
2. Update if needed: `cargo install --git https://github.com/MystenLabs/sui.git --branch testnet sui`
3. Clean and rebuild:
   ```bash
   rm -rf build/
   sui move build
   ```

### Issue: Deployment Transaction Fails

**Symptoms:**
```
InsufficientGas
```

**Solution:**
1. Get more testnet SUI: https://faucet.sui.io
2. Increase gas budget in deploy script:
   ```bash
   --gas-budget 200000000
   ```

### Issue: Environment Variables Not Loading

**Symptoms:**
- `undefined` values for contract IDs
- "Missing contract configuration" errors

**Solution:**
1. Verify .env.local exists in project root
2. Restart development server
3. Check for typos in variable names
4. Ensure all NEXT_PUBLIC_ variables are set

### Issue: "Payment Already Processed" Error

**Symptoms:**
```
Transaction failed: EPaymentAlreadyProcessed
```

**Solution:**
- Payment was already confirmed or refunded
- Check transaction status in admin dashboard
- Verify you're not trying to process twice

### Issue: "Payment Expired" Error

**Symptoms:**
```
Transaction failed: EPaymentExpired
```

**Solution:**
- Payment held for >30 minutes
- Use `claim_expired_payment` function
- Payment will be automatically refunded

### Issue: Callback Not Receiving Data

**Symptoms:**
- ClubKonnect callbacks timing out
- No updates after purchase

**Solution:**
1. Verify callback URL in ClubKonnect dashboard
2. If localhost, use ngrok:
   ```bash
   ngrok http 3000
   ```
3. Update ClubKonnect callback URL to ngrok URL

---

## 📊 Monitoring

### View Contract Events

```bash
# Get recent transactions
sui client objects --address <ADMIN_WALLET>

# Query specific transaction
sui client transaction <TX_DIGEST>
```

### Check Pending Payments

```bash
# In development console
npm run dev

# Watch logs for:
# - PaymentPending events
# - PaymentConfirmed events
# - PaymentRefunded events
```

### Database Queries

```bash
# Open Prisma Studio
npx prisma studio

# View in browser: http://localhost:5555
# Check transactions table for:
# - pendingPaymentId values
# - clubkonnectOrderId values
# - status changes
```

---

## 🔐 Security Considerations

### Private Key Management

**❌ DON'T:**
- Commit admin private keys to git
- Store keys in .env.local without .gitignore
- Share keys in plain text

**✅ DO:**
- Use environment variables
- Store keys in secure vault (AWS KMS, HashiCorp Vault)
- Rotate keys regularly
- Use different keys for dev/prod

### Admin Wallet Protection

1. **Multi-Sig**: Consider using multi-signature wallet for production
2. **Hardware Wallet**: Use Ledger/Trezor for admin operations
3. **Access Control**: Limit who has admin cap access

### Smart Contract Auditing

Before production:
- [ ] Security audit by professional firm
- [ ] Penetration testing
- [ ] Gas optimization review
- [ ] Edge case testing

---

## 📈 Performance Optimization

### Gas Costs

| Operation | Estimated Gas (SUI) | Cost @ $3/SUI |
|-----------|---------------------|---------------|
| Purchase (user) | ~0.001 | $0.003 |
| Confirm (admin) | ~0.0005 | $0.0015 |
| Refund (admin) | ~0.0005 | $0.0015 |
| **Total per transaction** | **~0.0015** | **~$0.0045** |

**Batch Optimization:**
Confirm 20 payments in 1 transaction:
- Single tx gas: ~0.002 SUI
- Savings: 90% vs individual confirms

### Callback Processing

For high volume:
1. Queue callbacks (Redis/RabbitMQ)
2. Batch process confirmations
3. Use websockets for real-time updates

---

## 🚀 Production Deployment

### Mainnet Checklist

Before deploying to Sui mainnet:

- [ ] All tests passing
- [ ] Security audit complete
- [ ] Load testing done
- [ ] Monitoring set up
- [ ] Backup systems in place
- [ ] ClubKonnect production credentials
- [ ] Real funds in admin wallet
- [ ] Emergency pause mechanism tested
- [ ] Customer support ready
- [ ] Terms of service updated

### Environment Differences

| Variable | Testnet | Mainnet |
|----------|---------|---------|
| SUI_NETWORK | testnet | mainnet |
| RPC_URL | fullnode.testnet.sui.io | fullnode.mainnet.sui.io |
| MOCK_MODE | true (testing) | false |
| AUTO_CONFIRM | false | Consider enabling |

---

## 📞 Support

### Getting Help

1. **Check Logs:**
   - Development server console
   - Browser developer console
   - Prisma Studio for database

2. **Review Documentation:**
   - [MOCK_MODE_SETUP.md](./MOCK_MODE_SETUP.md)
   - [README.md](./README.md)
   - This guide

3. **Debug Steps:**
   - Verify environment variables
   - Check contract deployment
   - Test with mock mode
   - Review transaction on Sui Explorer

### Common Commands Reference

```bash
# Check Sui status
sui client active-address
sui client active-env
sui client gas

# View contract
sui client object <CONTRACT_ID>

# Call contract function
sui client call --package <PKG> --module bill_payment --function <FUNC> --args <ARGS>

# Database
npx prisma studio
npx prisma db push
npx prisma generate

# Development
npm run dev
npm run build
npm run lint
```

---

## ✅ Success Criteria

Your deployment is successful when:

1. ✅ Contract deployed to testnet
2. ✅ All purchases held in escrow
3. ✅ Admin can confirm payments
4. ✅ Admin can refund payments
5. ✅ Callbacks processed correctly
6. ✅ Database logging working
7. ✅ No gas-related errors
8. ✅ UI shows pending payment actions
9. ✅ Mock mode works for testing
10. ✅ Real mode ready for production

---

**🎉 Congratulations! Your escrow system is deployed and ready!**

For questions or issues, review the troubleshooting section or check the main README.

