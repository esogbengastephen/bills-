# 🎭 Mock Mode Setup Guide

## Overview

Mock Mode allows you to test the entire SwitcherFi dApp without requiring actual ClubKonnect API credits. This is useful for:
- Development and testing
- Demo purposes
- When ClubKonnect account has insufficient balance

## Quick Setup

### Option 1: Environment Variable (Recommended)

1. Create or edit `.env.local` file in the project root:

```bash
# ClubKonnect Mock Mode
CLUBKONNECT_MOCK_MODE=true
CLUBKONNECT_MOCK_SUCCESS_RATE=100
```

2. Restart your development server:

```bash
npm run dev
```

### Option 2: Temporary Testing

If you don't have ClubKonnect credentials set, mock mode will automatically activate.

## Mock Mode Behavior

### What Gets Mocked

✅ **Airtime Purchases**
- Returns `ORDER_RECEIVED` status
- Generates mock order ID
- Simulates 100% success rate

✅ **Data Purchases**
- Returns `ORDER_RECEIVED` status
- Simulates data bundle purchase
- Generates mock transaction ID

✅ **Electricity Payments**
- Returns `ORDER_RECEIVED` status
- Simulates meter token generation
- Mock successful payment

✅ **TV Subscriptions**
- Returns `ORDER_RECEIVED` status
- Simulates subscription activation

✅ **Transaction Queries**
- Returns `ORDER_COMPLETED` status
- Mock transaction details

### What Still Works Normally

✅ **Sui Blockchain Integration**
- Real wallet connection
- Real SUI transactions
- Real smart contract calls
- Real gas fees (testnet SUI)

✅ **Database Logging**
- All transactions logged to SQLite
- Real analytics data
- Transaction history preserved

✅ **Price Conversion**
- Real-time SUI/USDC/USDT to Naira conversion
- Live CoinGecko API calls

✅ **Admin Dashboard**
- Full admin functionality
- Real contract monitoring
- Transaction management

## Testing Flow in Mock Mode

### 1. Purchase Airtime

```typescript
User Flow:
1. Select network (MTN/Airtel/GLO/9mobile)
2. Enter phone number
3. Enter amount
4. Connect wallet
5. Confirm transaction
6. ✅ Mock: ClubKonnect returns success
7. Payment goes to admin wallet (real blockchain)
8. Transaction logged to database
```

### 2. Expected Responses

**Airtime/Data/Electricity:**
```json
{
  "orderid": "MOCK_1760612345678",
  "statuscode": "100",
  "status": "ORDER_RECEIVED",
  "requestid": "SWF_1760612345678_abc123xyz"
}
```

**Query Transaction:**
```json
{
  "orderid": "MOCK_1760612345678",
  "statuscode": "200",
  "status": "ORDER_COMPLETED",
  "remark": "Mock transaction completed successfully",
  "ordertype": "Mock Service",
  "mobilenetwork": "MTN",
  "mobilenumber": "08012345678",
  "amountcharged": "100",
  "walletbalance": "1000",
  "date": "2025-10-16T12:00:00.000Z"
}
```

## Console Logs

When mock mode is active, you'll see:

```bash
🎭 ClubKonnect Mock Mode: Simulating successful response
   Endpoint: /APIAirtimeV1.asp
   Params: { UserID: 'CK101264658', APIKey: '***REDACTED***', ... }
```

## Switching to Production Mode

### Disable Mock Mode

1. Edit `.env.local`:

```bash
# Disable mock mode
CLUBKONNECT_MOCK_MODE=false
```

2. Ensure you have valid ClubKonnect credentials:

```bash
CLUBKONNECT_USER_ID=CK101264658
CLUBKONNECT_API_KEY=your_actual_api_key
```

3. Fund your ClubKonnect account with sufficient balance

4. Restart server:

```bash
npm run dev
```

## Troubleshooting

### Mock Mode Not Activating

**Check:**
1. `.env.local` file exists in project root
2. `CLUBKONNECT_MOCK_MODE=true` is set
3. Server has been restarted
4. No typos in environment variable name

**Verify:**
```bash
# Check if environment variable is loaded
node -e "console.log(process.env.CLUBKONNECT_MOCK_MODE)"
```

### Mock Mode Still Shows Real API Calls

**Solution:**
- Clear Next.js cache: `rm -rf .next/`
- Restart development server
- Check console for "🎭 ClubKonnect Mock Mode" message

### Want Partial Mock Mode

You can mock specific services by modifying `src/lib/clubkonnect.ts`:

```typescript
// Mock only airtime, use real API for others
if (isMockMode && endpoint === '/APIAirtimeV1.asp') {
  return this.getMockResponse(endpoint, requestParams)
}
```

## Production Checklist

Before deploying to production:

- [ ] Set `CLUBKONNECT_MOCK_MODE=false`
- [ ] Verify real ClubKonnect credentials
- [ ] Test with small amounts first
- [ ] Monitor ClubKonnect balance
- [ ] Check transaction logs
- [ ] Verify callbacks are working

## Advanced: Custom Mock Responses

Edit `src/lib/clubkonnect.ts` → `getMockResponse()` method:

```typescript
private getMockResponse(endpoint: string, params: any): ClubKonnectResponse {
  // Simulate different scenarios
  const mockResponses: { [key: string]: ClubKonnectResponse } = {
    '/APIAirtimeV1.asp': {
      orderid: `MOCK_${Date.now()}`,
      statuscode: '100',
      status: 'ORDER_RECEIVED',
      // Add custom fields here
    },
    // ... other endpoints
  }
  
  return mockResponses[endpoint] || defaultResponse
}
```

## Support

For issues with mock mode:
1. Check console logs for mock mode indicator
2. Verify environment variables
3. Review `src/lib/clubkonnect.ts` implementation
4. Check Next.js server logs

---

**Mock mode is perfect for development - but remember to disable it before going live!** 🚀

